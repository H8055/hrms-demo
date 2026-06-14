import { validationResult } from 'express-validator';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotification, createNotifications } from '../services/notification.service.js';
import { canUserPerform, getRolesWithPermission } from '../services/permission.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(start, end) {
  return Math.floor((startOfDay(end) - startOfDay(start)) / (24 * 60 * 60 * 1000)) + 1;
}

function enumerateDates(start, end) {
  const days = [];
  const current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function mapLeave(item) {
  return {
    id: item._id,
    leaveType: item.leaveType,
    fromDate: item.fromDate,
    toDate: item.toDate,
    days: item.days,
    reason: item.reason,
    status: item.status,
    managerComment: item.managerComment,
    decidedAt: item.decidedAt,
    user: item.user
      ? {
          id: item.user._id,
          name: item.user.name,
          email: item.user.email,
          department: item.user.department
        }
      : null,
    decidedBy: item.decidedBy
      ? {
          id: item.decidedBy._id,
          name: item.decidedBy.name,
          email: item.decidedBy.email
        }
      : null
  };
}

export const createLeave = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { leaveType, fromDate, toDate, reason } = req.body;
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);

  if (from > to) {
    return res.status(400).json({ message: 'fromDate cannot be after toDate' });
  }

  const days = diffDays(from, to);

  const existingOverlap = await LeaveRequest.findOne({
    user: req.user._id,
    status: { $in: ['pending', 'approved'] },
    $or: [{ fromDate: { $lte: to }, toDate: { $gte: from } }]
  });

  if (existingOverlap) {
    return res.status(409).json({ message: 'You already have an overlapping leave request' });
  }

  const item = await LeaveRequest.create({ user: req.user._id, leaveType, fromDate: from, toDate: to, days, reason });

  await writeAuditLog({
    actor: req.user._id,
    action: 'leave.created',
    entityType: 'LeaveRequest',
    entityId: item._id,
    metadata: { leaveType, days }
  });

  const reviewerRoles = await getRolesWithPermission('leave', 'approve');
  const reviewers = await User.find({ role: { $in: reviewerRoles }, isActive: true }).select('_id');
  await createNotifications(
    reviewers.map((reviewer) => ({
      recipient: reviewer._id,
      type: 'leave_request',
      title: 'New leave request',
      message: `${req.user.name} applied for ${days} day(s) of ${leaveType} leave.`,
      link: '/leaves',
      relatedEntityType: 'LeaveRequest',
      relatedEntityId: item._id
    }))
  );

  const saved = await LeaveRequest.findById(item._id).populate('user', 'name email department').populate('decidedBy', 'name email');
  res.status(201).json({ message: 'Leave request submitted', leave: mapLeave(saved) });
});

export const listMyLeaves = asyncHandler(async (req, res) => {
  const items = await LeaveRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name email department')
    .populate('decidedBy', 'name email');

  res.json({ items: items.map(mapLeave) });
});

export const listLeaves = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.user) query.user = req.query.user;

  const items = await LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'name email department designation')
    .populate('decidedBy', 'name email');

  res.json({ items: items.map(mapLeave) });
});

export const decideLeave = asyncHandler(async (req, res) => {
  const item = await LeaveRequest.findById(req.params.id).populate('user', 'name email department');
  if (!item) {
    return res.status(404).json({ message: 'Leave request not found' });
  }

  if (item.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending leave requests can be actioned' });
  }

  const decision = req.body.decision;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }

  item.status = decision;
  item.managerComment = req.body.comment || '';
  item.decidedBy = req.user._id;
  item.decidedAt = new Date();
  await item.save();

  if (decision === 'approved') {
    if (item.leaveType !== 'unpaid') {
      await User.findByIdAndUpdate(item.user._id, {
        $inc: { [`leaveBalances.${item.leaveType}`]: -item.days }
      });
    }

    const attendanceOps = enumerateDates(item.fromDate, item.toDate).map((date) => ({
      updateOne: {
        filter: { user: item.user._id, date },
        update: { $set: { user: item.user._id, date, status: 'on-leave', source: 'system' } },
        upsert: true
      }
    }));

    if (attendanceOps.length) {
      await AttendanceRecord.bulkWrite(attendanceOps);
    }
  }

  await writeAuditLog({
    actor: req.user._id,
    action: `leave.${decision}`,
    entityType: 'LeaveRequest',
    entityId: item._id,
    metadata: { comment: req.body.comment || '' }
  });

  await createNotification({
    recipient: item.user._id,
    type: 'leave_decision',
    title: `Leave request ${decision}`,
    message: `Your ${item.leaveType} leave request was ${decision}.`,
    link: '/leaves',
    relatedEntityType: 'LeaveRequest',
    relatedEntityId: item._id
  });

  const saved = await LeaveRequest.findById(item._id).populate('user', 'name email department').populate('decidedBy', 'name email');
  res.json({ message: `Leave request ${decision}`, leave: mapLeave(saved) });
});

export const getLeaveSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('leaveBalances');
  const canManageLeaves = await canUserPerform(req.user, 'leave', 'approve');
  const query = canManageLeaves ? {} : { user: req.user._id };
  const items = await LeaveRequest.find(query);

  res.json({
    balances: user?.leaveBalances || { annual: 0, sick: 0, casual: 0 },
    pending: items.filter((item) => item.status === 'pending').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    totalDaysApproved: items.filter((item) => item.status === 'approved').reduce((sum, item) => sum + item.days, 0)
  });
});

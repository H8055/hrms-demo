import { validationResult } from 'express-validator';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotifications } from '../services/notification.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function mapAttendance(record) {
  return {
    id: record._id,
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: record.status,
    source: record.source,
    user: record.user
      ? {
          id: record.user._id,
          name: record.user.name,
          email: record.user.email,
          department: record.user.department
        }
      : null,
    regularization: record.regularization || {}
  };
}

async function notifyReviewers(record, actorName) {
  const reviewers = await User.find({ role: { $in: ['admin', 'hr', 'manager'] }, isActive: true }).select('_id');
  await createNotifications(
    reviewers.map((reviewer) => ({
      recipient: reviewer._id,
      type: 'attendance_regularization',
      title: 'Attendance regularization request',
      message: `${actorName} submitted an attendance regularization request.`,
      link: '/attendance',
      relatedEntityType: 'AttendanceRecord',
      relatedEntityId: record._id
    }))
  );
}

export const checkIn = asyncHandler(async (req, res) => {
  const today = startOfDay();
  let record = await AttendanceRecord.findOne({ user: req.user._id, date: today });

  if (record?.checkIn) {
    return res.status(400).json({ message: 'You have already checked in today' });
  }

  if (!record) {
    record = await AttendanceRecord.create({
      user: req.user._id,
      date: today,
      checkIn: new Date(),
      status: 'present',
      source: 'self'
    });
  } else {
    record.checkIn = new Date();
    record.status = 'present';
    record.source = 'self';
    await record.save();
  }

  await writeAuditLog({
    actor: req.user._id,
    action: 'attendance.checkin',
    entityType: 'AttendanceRecord',
    entityId: record._id,
    metadata: { date: today.toISOString() }
  });

  const populated = await AttendanceRecord.findById(record._id).populate('user', 'name email department');
  res.json({ message: 'Checked in successfully', attendance: mapAttendance(populated) });
});

export const checkOut = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const record = await AttendanceRecord.findOne({ user: req.user._id, date: today });

  if (!record?.checkIn) {
    return res.status(400).json({ message: 'You need to check in before checking out' });
  }

  if (record.checkOut) {
    return res.status(400).json({ message: 'You have already checked out today' });
  }

  record.checkOut = new Date();
  await record.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'attendance.checkout',
    entityType: 'AttendanceRecord',
    entityId: record._id,
    metadata: { date: today.toISOString() }
  });

  const populated = await AttendanceRecord.findById(record._id).populate('user', 'name email department');
  res.json({ message: 'Checked out successfully', attendance: mapAttendance(populated) });
});

export const listMyAttendance = asyncHandler(async (req, res) => {
  const items = await AttendanceRecord.find({ user: req.user._id })
    .sort({ date: -1 })
    .limit(60)
    .populate('user', 'name email department');

  res.json({ items: items.map(mapAttendance) });
});

export const listAttendance = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.user) query.user = req.query.user;
  if (req.query.status) query.status = req.query.status;
  if (req.query.dateFrom || req.query.dateTo) {
    query.date = {};
    if (req.query.dateFrom) query.date.$gte = startOfDay(new Date(req.query.dateFrom));
    if (req.query.dateTo) query.date.$lte = endOfDay(new Date(req.query.dateTo));
  }

  const items = await AttendanceRecord.find(query)
    .sort({ date: -1 })
    .limit(200)
    .populate('user', 'name email department designation');

  res.json({ items: items.map(mapAttendance) });
});

export const regularizeAttendance = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const targetDate = startOfDay(new Date(req.body.date));
  const record = await AttendanceRecord.findOneAndUpdate(
    { user: req.user._id, date: targetDate },
    {
      $set: {
        status: 'regularization-pending',
        source: 'self',
        'regularization.requestedAt': new Date(),
        'regularization.reason': req.body.reason,
        'regularization.requestedCheckIn': req.body.requestedCheckIn ? new Date(req.body.requestedCheckIn) : null,
        'regularization.requestedCheckOut': req.body.requestedCheckOut ? new Date(req.body.requestedCheckOut) : null,
        'regularization.status': 'pending',
        'regularization.decisionComment': '',
        'regularization.decidedBy': null,
        'regularization.decidedAt': null
      }
    },
    { new: true, upsert: true }
  ).populate('user', 'name email department');

  await writeAuditLog({
    actor: req.user._id,
    action: 'attendance.regularization.requested',
    entityType: 'AttendanceRecord',
    entityId: record._id,
    metadata: { date: targetDate.toISOString(), reason: req.body.reason }
  });

  await notifyReviewers(record, req.user.name);

  res.status(201).json({ message: 'Regularization request submitted', attendance: mapAttendance(record) });
});

export const decideRegularization = asyncHandler(async (req, res) => {
  const record = await AttendanceRecord.findById(req.params.id).populate('user', 'name email department');
  if (!record) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }

  const decision = req.body.decision;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }

  record.regularization.status = decision;
  record.regularization.decisionComment = req.body.comment || '';
  record.regularization.decidedBy = req.user._id;
  record.regularization.decidedAt = new Date();

  if (decision === 'approved') {
    if (record.regularization.requestedCheckIn) record.checkIn = record.regularization.requestedCheckIn;
    if (record.regularization.requestedCheckOut) record.checkOut = record.regularization.requestedCheckOut;
    record.status = 'present';
  } else {
    record.status = record.checkIn ? 'present' : 'absent';
  }

  await record.save();

  await writeAuditLog({
    actor: req.user._id,
    action: `attendance.regularization.${decision}`,
    entityType: 'AttendanceRecord',
    entityId: record._id,
    metadata: { comment: req.body.comment || '' }
  });

  res.json({ message: `Regularization ${decision}`, attendance: mapAttendance(record) });
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const query = ['admin', 'hr', 'manager'].includes(req.user.role) ? {} : { user: req.user._id };
  const items = await AttendanceRecord.find(query);

  res.json({
    present: items.filter((item) => item.status === 'present').length,
    absent: items.filter((item) => item.status === 'absent').length,
    onLeave: items.filter((item) => item.status === 'on-leave').length,
    pendingRegularization: items.filter((item) => item.status === 'regularization-pending').length,
    total: items.length
  });
});

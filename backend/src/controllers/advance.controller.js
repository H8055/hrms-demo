import { validationResult } from 'express-validator';
import { AdvanceRequest } from '../models/AdvanceRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { sendMail } from '../services/mail.service.js';
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

function getMonthRange(date = new Date()) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
  };
}

function normalizeDepartmentName(value = '') {
  return value.toString().trim().toLowerCase();
}

async function getAdvanceWorkflowConfig() {
  const settings = await CompanySettings.findOne().select('advanceWorkflow');
  return {
    approvalDepartments: settings?.advanceWorkflow?.approvalDepartments || ['Human Resources'],
    payoutDepartments: settings?.advanceWorkflow?.payoutDepartments || ['Accounts']
  };
}

function isDepartmentAllowed(user, allowedDepartments = []) {
  if (!allowedDepartments?.length) return true;
  const userDept = normalizeDepartmentName(user?.department);
  return allowedDepartments.map(normalizeDepartmentName).includes(userDept);
}

async function canApproveAdvance(user) {
  const hasAccess = await canUserPerform(user, 'advance', 'approve');
  if (!hasAccess) return false;
  const workflow = await getAdvanceWorkflowConfig();
  return isDepartmentAllowed(user, workflow.approvalDepartments);
}

async function canPayAdvance(user) {
  const hasAccess = await canUserPerform(user, 'advance', 'pay');
  if (!hasAccess) return false;
  const workflow = await getAdvanceWorkflowConfig();
  return isDepartmentAllowed(user, workflow.payoutDepartments);
}

async function canManageAdvance(user) {
  return (await canApproveAdvance(user)) || (await canPayAdvance(user));
}

async function getUsersForAdvanceStage(action, allowedDepartments) {
  const roles = await getRolesWithPermission('advance', action);
  const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id email name department');
  return users.filter((user) => isDepartmentAllowed(user, allowedDepartments));
}

async function notifyPayers({ title, message, advanceId, metadata = {} }) {
  const workflow = await getAdvanceWorkflowConfig();
  const recipients = await getUsersForAdvanceStage('pay', workflow.payoutDepartments);

  await Promise.all(
    recipients.map((recipient) =>
      sendMail({
        to: recipient.email,
        subject: title,
        text: message
      })
    )
  );

  return createNotifications(
    recipients.map((recipient) => ({
      recipient: recipient._id,
      type: 'advance_ready_for_payout',
      title,
      message,
      link: '/advances/admin',
      relatedEntityType: 'AdvanceRequest',
      relatedEntityId: advanceId,
      metadata
    }))
  );
}

function mapUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    designation: user.designation
  };
}

function mapAdvance(doc) {
  return {
    id: doc._id,
    amount: doc.amount,
    reason: doc.reason,
    repaymentPlan: doc.repaymentPlan,
    status: doc.status,
    notes: doc.notes,
    adminNote: doc.adminNote,
    rejectionReason: doc.rejectionReason,
    approvedAt: doc.approvedAt,
    rejectedAt: doc.rejectedAt,
    paidAt: doc.paidAt,
    paymentMode: doc.paymentMode,
    reference: doc.reference,
    createdAt: doc.createdAt,
    requestedBy: mapUser(doc.requestedBy),
    processedBy: mapUser(doc.processedBy),
    approvedBy: mapUser(doc.approvedBy)
  };
}

function baseAdvanceQuery() {
  return AdvanceRequest.find()
    .populate('requestedBy', 'name email department designation')
    .populate('processedBy', 'name email department designation')
    .populate('approvedBy', 'name email department designation');
}

async function getActivityLog(advanceId) {
  const logs = await AuditLog.find({ entityType: 'AdvanceRequest', entityId: advanceId })
    .sort({ createdAt: 1 })
    .populate('actor', 'name email role');

  return logs.map((log) => ({
    id: log._id,
    action: log.action,
    metadata: log.metadata || {},
    createdAt: log.createdAt,
    actor: log.actor
      ? {
          id: log.actor._id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role
        }
      : null
  }));
}

async function notifyApprovers({ title, message, advanceId, metadata = {} }) {
  const workflow = await getAdvanceWorkflowConfig();
  const recipients = await getUsersForAdvanceStage('approve', workflow.approvalDepartments);

  return createNotifications(
    recipients.map((recipient) => ({
      recipient: recipient._id,
      type: 'advance_submitted',
      title,
      message,
      link: '/advances/admin',
      relatedEntityType: 'AdvanceRequest',
      relatedEntityId: advanceId,
      metadata
    }))
  );
}

export const createAdvance = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { amount, reason, repaymentPlan, notes } = req.body;
  const { start, end } = getMonthRange();

  const duplicateThisMonth = await AdvanceRequest.findOne({
    requestedBy: req.user._id,
    createdAt: { $gte: start, $lt: end },
    status: { $ne: 'paid' }
  });

  if (duplicateThisMonth) {
    return res.status(409).json({ message: 'You cannot request another advance this month unless your previous request has been paid out' });
  }

  const activeRequest = await AdvanceRequest.findOne({
    requestedBy: req.user._id,
    status: { $in: ['pending', 'approved'] }
  });

  if (activeRequest) {
    return res.status(409).json({ message: 'You already have an active advance request' });
  }

  const advance = await AdvanceRequest.create({
    requestedBy: req.user._id,
    amount,
    reason,
    repaymentPlan,
    notes: notes || '',
    status: 'pending'
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'advance.created',
    entityType: 'AdvanceRequest',
    entityId: advance._id,
    metadata: { amount, reason, repaymentPlan }
  });

  const workflow = await getAdvanceWorkflowConfig();
  const adminUsers = await getUsersForAdvanceStage('approve', workflow.approvalDepartments);

  await Promise.all(
    adminUsers.map((admin) =>
      sendMail({
        to: admin.email,
        subject: 'New advance request submitted',
        text: `${req.user.name} submitted an advance request for ₹${amount}.`
      })
    )
  );

  await notifyApprovers({
    title: 'New advance request',
    message: `${req.user.name} requested ₹${amount.toLocaleString('en-IN')} and is awaiting review.`,
    advanceId: advance._id,
    metadata: { amount, requesterName: req.user.name }
  });

  await createNotification({
    recipient: req.user._id,
    type: 'advance_status',
    title: 'Advance request submitted',
    message: 'Your advance request has been submitted and is now pending review.',
    link: '/advances/my',
    relatedEntityType: 'AdvanceRequest',
    relatedEntityId: advance._id,
    metadata: { status: 'pending' }
  });

  const populated = await baseAdvanceQuery().findOne({ _id: advance._id });

  return res.status(201).json({
    message: 'Advance request submitted successfully',
    advance: mapAdvance(populated)
  });
});

export const listAdvances = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 100);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.employee) query.requestedBy = req.query.employee;
  if (req.query.dateFrom || req.query.dateTo) {
    query.createdAt = {};
    if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
  }

  if (req.query.q?.trim()) {
    const regex = new RegExp(req.query.q.trim(), 'i');
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }, { department: regex }, { designation: regex }]
    }).select('_id');

    query.requestedBy = { $in: matchedUsers.map((user) => user._id) };
  }

  const [items, total] = await Promise.all([
    baseAdvanceQuery().find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdvanceRequest.countDocuments(query)
  ]);

  return res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items: items.map(mapAdvance)
  });
});

export const getAdvanceSummary = asyncHandler(async (req, res) => {
  const userFilter = (await canManageAdvance(req.user)) ? {} : { requestedBy: req.user._id };
  const { start, end } = getMonthRange();

  const [allItems, thisMonthItems] = await Promise.all([
    AdvanceRequest.find(userFilter),
    AdvanceRequest.find({ ...userFilter, createdAt: { $gte: start, $lt: end } })
  ]);

  const summary = {
    totalRequests: allItems.length,
    pendingCount: allItems.filter((item) => item.status === 'pending').length,
    approvedCount: allItems.filter((item) => item.status === 'approved').length,
    rejectedCount: allItems.filter((item) => item.status === 'rejected').length,
    paidCount: allItems.filter((item) => item.status === 'paid').length,
    totalDisbursed: allItems.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0),
    thisMonthRequested: thisMonthItems.reduce((sum, item) => sum + item.amount, 0),
    thisMonthDisbursed: thisMonthItems
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + item.amount, 0),
    hasActiveRequest: allItems.some((item) => ['pending', 'approved'].includes(item.status))
  };

  res.json(summary);
});

export const getMyAdvances = asyncHandler(async (req, res) => {
  const items = await baseAdvanceQuery().find({ requestedBy: req.user._id }).sort({ createdAt: -1 });

  return res.json({ items: items.map(mapAdvance) });
});

export const getAdvanceById = asyncHandler(async (req, res) => {
  const item = await baseAdvanceQuery().findOne({ _id: req.params.id });

  if (!item) {
    return res.status(404).json({ message: 'Advance request not found' });
  }

  const isOwner = item.requestedBy?._id?.toString() === req.user._id.toString();
  const canApprove = await canUserPerform(req.user, 'advance', 'approve');
  const canPay = await canUserPerform(req.user, 'advance', 'pay');
  const elevated = canApprove || canPay;

  if (!isOwner && !elevated) {
    return res.status(403).json({ message: 'Not authorised to view this request' });
  }

  const [history, activityLog] = await Promise.all([
    baseAdvanceQuery().find({ requestedBy: item.requestedBy._id }).sort({ createdAt: -1 }).limit(10),
    getActivityLog(item._id)
  ]);

  return res.json({
    advance: mapAdvance(item),
    history: history.map(mapAdvance),
    activityLog
  });
});

export const approveAdvance = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  if (!(await canApproveAdvance(req.user))) {
    return res.status(403).json({ message: 'Your department or role is not allowed to approve advance requests' });
  }

  const item = await AdvanceRequest.findById(req.params.id).populate('requestedBy', 'name email');
  if (!item) {
    return res.status(404).json({ message: 'Advance request not found' });
  }

  if (item.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending requests can be approved' });
  }

  item.status = 'approved';
  item.approvedBy = req.user._id;
  item.processedBy = req.user._id;
  item.approvedAt = new Date();
  item.adminNote = req.body.note || '';
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'advance.approved',
    entityType: 'AdvanceRequest',
    entityId: item._id,
    metadata: { note: req.body.note || '' }
  });

  await sendMail({
    to: item.requestedBy.email,
    subject: 'Advance request approved',
    text: `Your advance request for ₹${item.amount} has been approved.`
  });

  await notifyPayers({
    title: 'Advance request approved and ready for payout',
    message: `${item.requestedBy.name} has an approved advance request of ₹${item.amount.toLocaleString('en-IN')} awaiting payout.`,
    advanceId: item._id,
    metadata: { status: 'approved', requesterName: item.requestedBy.name, amount: item.amount }
  });

  await createNotification({
    recipient: item.requestedBy._id,
    type: 'advance_status',
    title: 'Advance request approved',
    message: `Your request for ₹${item.amount.toLocaleString('en-IN')} was approved.`,
    link: '/advances/my',
    relatedEntityType: 'AdvanceRequest',
    relatedEntityId: item._id,
    metadata: { status: 'approved', note: req.body.note || '' }
  });

  const populated = await baseAdvanceQuery().findOne({ _id: item._id });

  return res.json({ message: 'Advance request approved', advance: mapAdvance(populated) });
});

export const rejectAdvance = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason?.trim()) {
    return res.status(400).json({ message: 'rejectionReason is required' });
  }

  const item = await AdvanceRequest.findById(req.params.id).populate('requestedBy', 'name email');
  if (!item) {
    return res.status(404).json({ message: 'Advance request not found' });
  }

  if (item.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending requests can be rejected' });
  }

  item.status = 'rejected';
  item.rejectionReason = rejectionReason;
  item.rejectedAt = new Date();
  item.processedBy = req.user._id;
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'advance.rejected',
    entityType: 'AdvanceRequest',
    entityId: item._id,
    metadata: { rejectionReason }
  });

  await sendMail({
    to: item.requestedBy.email,
    subject: 'Advance request rejected',
    text: `Your advance request was rejected. Reason: ${rejectionReason}`
  });

  await createNotification({
    recipient: item.requestedBy._id,
    type: 'advance_status',
    title: 'Advance request rejected',
    message: `Your advance request was rejected. Reason: ${rejectionReason}`,
    link: '/advances/my',
    relatedEntityType: 'AdvanceRequest',
    relatedEntityId: item._id,
    metadata: { status: 'rejected', rejectionReason }
  });

  const populated = await baseAdvanceQuery().findOne({ _id: item._id });

  return res.json({ message: 'Advance request rejected', advance: mapAdvance(populated) });
});

export const payAdvance = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  if (!(await canPayAdvance(req.user))) {
    return res.status(403).json({ message: 'Your department or role is not allowed to process advance payouts' });
  }

  const { paymentDate, paymentMode, reference } = req.body;
  const paymentDateObj = new Date(paymentDate);
  if (Number.isNaN(paymentDateObj.valueOf()) || paymentDateObj > new Date()) {
    return res.status(400).json({ message: 'paymentDate must be a valid date and not in the future' });
  }

  const item = await AdvanceRequest.findById(req.params.id).populate('requestedBy', 'name email');
  if (!item) {
    return res.status(404).json({ message: 'Advance request not found' });
  }

  if (item.status !== 'approved') {
    return res.status(400).json({ message: 'Only approved requests can be marked as paid' });
  }

  item.status = 'paid';
  item.processedBy = req.user._id;
  item.paidAt = paymentDateObj;
  item.paymentMode = paymentMode;
  item.reference = reference || '';
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'advance.paid',
    entityType: 'AdvanceRequest',
    entityId: item._id,
    metadata: { paymentMode, reference: reference || '', paymentDate: paymentDateObj.toISOString() }
  });

  await sendMail({
    to: item.requestedBy.email,
    subject: 'Advance request paid',
    text: `Your approved advance has been paid via ${paymentMode}.`
  });

  await createNotification({
    recipient: item.requestedBy._id,
    type: 'advance_status',
    title: 'Advance payment processed',
    message: `Your advance payment was processed via ${paymentMode} on ${paymentDateObj.toLocaleDateString('en-IN')}.`,
    link: '/advances/my',
    relatedEntityType: 'AdvanceRequest',
    relatedEntityId: item._id,
    metadata: { status: 'paid', paymentMode, reference: reference || '' }
  });

  const populated = await baseAdvanceQuery().findOne({ _id: item._id });

  return res.json({ message: 'Advance request marked as paid', advance: mapAdvance(populated) });
});

import { ProfileChangeRequest } from '../models/ProfileChangeRequest.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';
import { refreshCompletion } from '../services/completion.service.js';

// Employee-editable fields that may be submitted as a self-service change request.
const ALLOWED_PATHS = new Set([
  'phone',
  'address',
  'photoUrl',
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'maritalStatus',
  'emergencyContactName',
  'emergencyContactPhone',
  'bankDetails.accountName',
  'bankDetails.accountNumber',
  'bankDetails.ifsc'
]);

function readPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function writePath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
}

function mapRequest(item) {
  return {
    id: item._id,
    user: item.user?._id
      ? { id: item.user._id, name: item.user.name, email: item.user.email }
      : item.user,
    changes: item.changes,
    previousValues: item.previousValues,
    note: item.note,
    status: item.status,
    reviewNote: item.reviewNote,
    reviewedBy: item.reviewedBy?._id ? { id: item.reviewedBy._id, name: item.reviewedBy.name } : null,
    reviewedAt: item.reviewedAt,
    createdAt: item.createdAt
  };
}

// Employee submits proposed edits — queued for HR, not written live.
export const submitChangeRequest = asyncHandler(async (req, res) => {
  const changes = req.body.changes || {};
  const entries = Object.entries(changes).filter(([key]) => ALLOWED_PATHS.has(key));

  if (entries.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const user = await User.findById(req.user._id);
  const previousValues = {};
  const cleanChanges = {};
  for (const [key, value] of entries) {
    previousValues[key] = readPath(user, key) ?? '';
    cleanChanges[key] = value;
  }

  const request = await ProfileChangeRequest.create({
    user: req.user._id,
    requestedBy: req.user._id,
    changes: cleanChanges,
    previousValues,
    note: req.body.note || ''
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'profile.change_request.submitted',
    entityType: 'ProfileChangeRequest',
    entityId: request._id,
    metadata: { fields: Object.keys(cleanChanges) }
  });

  // Notify HR/admins so the queue gets reviewed.
  const reviewers = await User.find({ role: { $in: ['hr', 'admin'] }, isActive: true }).select('_id');
  await Promise.all(
    reviewers.map((reviewer) =>
      createNotification({
        recipient: reviewer._id,
        type: 'profile.change_request',
        title: 'Profile change request',
        message: `${user.name} requested changes to ${Object.keys(cleanChanges).join(', ')}.`,
        link: '/profile/change-requests',
        relatedEntityType: 'ProfileChangeRequest',
        relatedEntityId: request._id
      })
    )
  );

  res.status(201).json({ message: 'Change request submitted for approval', request: mapRequest(request) });
});

// HR lists requests; employees see only their own.
export const listChangeRequests = asyncHandler(async (req, res) => {
  const isReviewer = ['hr', 'admin'].includes(req.user.role);
  const query = isReviewer ? {} : { user: req.user._id };
  if (req.query.status) query.status = req.query.status;

  const items = await ProfileChangeRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('reviewedBy', 'name');

  res.json({ items: items.map(mapRequest) });
});

// HR approves (applies changes to the User) or rejects.
export const reviewChangeRequest = asyncHandler(async (req, res) => {
  const { decision, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "approved" or "rejected"' });
  }

  const request = await ProfileChangeRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Change request not found' });
  }
  if (request.status !== 'pending') {
    return res.status(409).json({ message: 'This request has already been reviewed' });
  }

  if (decision === 'approved') {
    const user = await User.findById(request.user);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    for (const [key, value] of Object.entries(request.changes)) {
      if (ALLOWED_PATHS.has(key)) writePath(user, key, value);
    }
    user.markModified('bankDetails');
    await user.save();
    await refreshCompletion(user._id, { notifyOnDrop: false });
  }

  request.status = decision;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote || '';
  await request.save();

  await writeAuditLog({
    actor: req.user._id,
    action: `profile.change_request.${decision}`,
    entityType: 'ProfileChangeRequest',
    entityId: request._id,
    metadata: { userId: request.user.toString(), fields: Object.keys(request.changes) }
  });

  await createNotification({
    recipient: request.user,
    type: 'profile.change_request.reviewed',
    title: decision === 'approved' ? 'Profile changes approved' : 'Profile changes rejected',
    message:
      decision === 'approved'
        ? 'Your requested profile changes have been applied.'
        : `Your profile change request was rejected. ${reviewNote ? 'Reason: ' + reviewNote : ''}`,
    link: '/profile',
    relatedEntityType: 'ProfileChangeRequest',
    relatedEntityId: request._id
  });

  const saved = await ProfileChangeRequest.findById(request._id)
    .populate('user', 'name email')
    .populate('reviewedBy', 'name');
  res.json({ message: `Change request ${decision}`, request: mapRequest(saved) });
});

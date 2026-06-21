import { EmployeeDocument } from '../models/EmployeeDocument.js';
import { User } from '../models/User.js';
import { FIELD_REGISTRY, totalRegistryWeight } from '../config/employeeProfile.js';
import { createNotification } from './notification.service.js';

function readPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isFilled(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

// Computes completion against the current registry version.
// Returns { percent, registryVersion, missingFields, completedKeys }.
export async function computeCompletion(user) {
  const totalWeight = totalRegistryWeight();

  // Pull the employee's current, non-rejected documents once.
  const docs = await EmployeeDocument.find({
    user: user._id,
    isCurrent: true,
    status: { $ne: 'rejected' }
  }).select('category subType');

  const docKey = (category, subType) => `${category}:${subType}`;
  const ownedDocs = new Set(docs.map((doc) => docKey(doc.category, doc.subType)));

  let earned = 0;
  const missingFields = [];
  const completedKeys = [];

  for (const field of FIELD_REGISTRY.fields) {
    const weight = field.weight || 1;
    let filled = false;

    if (field.kind === 'document') {
      filled = ownedDocs.has(docKey(field.category, field.subType));
    } else {
      filled = isFilled(readPath(user, field.path));
    }

    if (filled) {
      earned += weight;
      completedKeys.push(field.key);
    } else {
      missingFields.push({ key: field.key, label: field.label });
    }
  }

  const percent = totalWeight === 0 ? 100 : Math.round((earned / totalWeight) * 100);

  return {
    percent,
    registryVersion: FIELD_REGISTRY.version,
    missingFields,
    completedKeys
  };
}

// Recompute, persist the cached snapshot on the User, and (optionally) fire a
// notification when the profile drops below 100% — e.g. after a registry
// version bump introduced a new required field, or a document was rejected.
export async function refreshCompletion(userId, { notifyOnDrop = true } = {}) {
  const user = await User.findById(userId);
  if (!user) return null;

  const previous = user.profileCompletion || {};
  const result = await computeCompletion(user);

  const droppedBelow100 = previous.percent >= 100 && result.percent < 100;
  const versionChanged = previous.registryVersion !== result.registryVersion;

  user.profileCompletion = {
    percent: result.percent,
    registryVersion: result.registryVersion,
    missingFields: result.missingFields.map((field) => field.label),
    computedAt: new Date()
  };
  await user.save();

  if (notifyOnDrop && droppedBelow100) {
    const reason = versionChanged
      ? 'New profile information is now required.'
      : 'Some profile information needs your attention.';
    await createNotification({
      recipient: user._id,
      type: 'profile.completion',
      title: `Profile is ${result.percent}% complete`,
      message: `${reason} Please update: ${result.missingFields.map((f) => f.label).join(', ') || 'pending items'}.`,
      link: '/profile',
      relatedEntityType: 'User',
      relatedEntityId: user._id,
      metadata: { percent: result.percent, registryVersion: result.registryVersion }
    });
  }

  return result;
}

// Bulk recompute for every active employee — run this after bumping
// FIELD_REGISTRY.version so previously-complete profiles drop and get notified.
export async function recomputeAllCompletions() {
  const users = await User.find({ isActive: true }).select('_id');
  let notified = 0;
  for (const { _id } of users) {
    const before = await User.findById(_id).select('profileCompletion');
    const wasComplete = (before?.profileCompletion?.percent || 0) >= 100;
    const result = await refreshCompletion(_id, { notifyOnDrop: true });
    if (wasComplete && result && result.percent < 100) notified += 1;
  }
  return { processed: users.length, notified };
}

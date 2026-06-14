import { validationResult } from 'express-validator';
import { PerformanceReview } from '../models/PerformanceReview.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';
import { canUserPerform } from '../services/permission.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function mapReview(item) {
  return {
    id: item._id,
    cycle: item.cycle,
    goals: item.goals,
    rating: item.rating,
    feedback: item.feedback,
    status: item.status,
    user: item.user
      ? {
          id: item.user._id,
          name: item.user.name,
          email: item.user.email,
          department: item.user.department
        }
      : null,
    reviewer: item.reviewer
      ? {
          id: item.reviewer._id,
          name: item.reviewer.name,
          email: item.reviewer.email
        }
      : null,
    createdAt: item.createdAt
  };
}

export const createReview = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const item = await PerformanceReview.create({
    user: req.body.userId,
    reviewer: req.user._id,
    cycle: req.body.cycle,
    goals: req.body.goals || [],
    rating: req.body.rating,
    feedback: req.body.feedback || '',
    status: req.body.status || 'completed'
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'performance.review.created',
    entityType: 'PerformanceReview',
    entityId: item._id,
    metadata: { cycle: req.body.cycle, rating: req.body.rating }
  });

  await createNotification({
    recipient: req.body.userId,
    type: 'performance_review',
    title: 'Performance review added',
    message: `A performance review for ${req.body.cycle} has been added to your profile.`,
    link: '/performance',
    relatedEntityType: 'PerformanceReview',
    relatedEntityId: item._id
  });

  const saved = await PerformanceReview.findById(item._id)
    .populate('user', 'name email department')
    .populate('reviewer', 'name email');

  res.status(201).json({ message: 'Performance review saved', review: mapReview(saved) });
});

export const listReviews = asyncHandler(async (req, res) => {
  const canManagePerformance = (await canUserPerform(req.user, 'performance', 'create')) || (await canUserPerform(req.user, 'performance', 'approve')) || (await canUserPerform(req.user, 'performance', 'edit'));
  const query = canManagePerformance ? {} : { user: req.user._id };
  if (req.query.user && canManagePerformance) query.user = req.query.user;

  const items = await PerformanceReview.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'name email department')
    .populate('reviewer', 'name email');

  res.json({ items: items.map(mapReview) });
});

export const getPerformanceSummary = asyncHandler(async (req, res) => {
  const canManagePerformance = (await canUserPerform(req.user, 'performance', 'create')) || (await canUserPerform(req.user, 'performance', 'approve')) || (await canUserPerform(req.user, 'performance', 'edit'));
  const query = canManagePerformance ? {} : { user: req.user._id };
  const items = await PerformanceReview.find(query);
  const averageRating = items.length ? items.reduce((sum, item) => sum + item.rating, 0) / items.length : 0;

  res.json({
    totalReviews: items.length,
    averageRating: Number(averageRating.toFixed(2))
  });
});

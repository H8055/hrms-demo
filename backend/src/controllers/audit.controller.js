import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function mapLog(item) {
  return {
    id: item._id,
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    actor: item.actor
      ? {
          id: item.actor._id,
          name: item.actor.name,
          email: item.actor.email,
          role: item.actor.role
        }
      : null
  };
}

export const listAuditLogs = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.entityType) query.entityType = req.query.entityType;
  if (req.query.action) query.action = new RegExp(req.query.action, 'i');

  const items = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit || 100), 250))
    .populate('actor', 'name email role');

  res.json({ items: items.map(mapLog) });
});

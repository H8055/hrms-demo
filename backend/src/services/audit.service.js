import { AuditLog } from '../models/AuditLog.js';

export async function writeAuditLog({ actor, action, entityType, entityId, metadata = {} }) {
  return AuditLog.create({ actor, action, entityType, entityId, metadata });
}

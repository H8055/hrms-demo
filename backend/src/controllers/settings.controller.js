import { CompanySettings } from '../models/CompanySettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  let item = await CompanySettings.findOne();
  if (!item) {
    item = await CompanySettings.create({});
  }

  res.json({ settings: item });
});

export const updateSettings = asyncHandler(async (req, res) => {
  let item = await CompanySettings.findOne();
  if (!item) {
    item = await CompanySettings.create({});
  }

  Object.assign(item, req.body);
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'settings.updated',
    entityType: 'CompanySettings',
    entityId: item._id,
    metadata: { updatedFields: Object.keys(req.body) }
  });

  res.json({ message: 'Settings updated', settings: item });
});

import { validationResult } from 'express-validator';
import { CompanySettings } from '../models/CompanySettings.js';
import { MasterDataItem } from '../models/MasterDataItem.js';
import { Role } from '../models/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { getMasterCategories, getGroupedMasterData, getMasterDataByCategory } from '../services/master-data.service.js';
import { getAllRoles } from '../services/role.service.js';
import { seedDefaultRolePermissions } from '../services/permission.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapRole(role) {
  return {
    id: role._id,
    key: role.key,
    label: role.label,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive,
    sortOrder: role.sortOrder,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
}

function mapMasterItem(item) {
  return {
    id: item._id,
    category: item.category,
    key: item.key,
    label: item.label,
    description: item.description,
    isSystem: item.isSystem,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}


export const getFormOptions = asyncHandler(async (req, res) => {
  const [roles, groupedMasterData] = await Promise.all([
    getAllRoles({ includeInactive: false }),
    getGroupedMasterData({ includeInactive: false })
  ]);

  res.json({
    roles: roles.map(mapRole),
    masterData: Object.fromEntries(
      Object.entries(groupedMasterData).map(([category, items]) => [category, items.map(mapMasterItem)])
    )
  });
});

export const getSettingsBundle = asyncHandler(async (req, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = await CompanySettings.create({});

  const [roles, groupedMasterData, categories] = await Promise.all([
    getAllRoles({ includeInactive: true }),
    getGroupedMasterData({ includeInactive: true }),
    getMasterCategories()
  ]);

  res.json({
    settings,
    roles: roles.map(mapRole),
    masterData: Object.fromEntries(
      Object.entries(groupedMasterData).map(([category, items]) => [category, items.map(mapMasterItem)])
    ),
    categories
  });
});

export const listRoles = asyncHandler(async (req, res) => {
  const roles = await getAllRoles({ includeInactive: true });
  res.json({ items: roles.map(mapRole) });
});

export const createRole = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const key = slugify(req.body.key || req.body.label);
  if (!key) {
    return res.status(400).json({ message: 'Role key or label is required' });
  }

  const existing = await Role.findOne({ key });
  if (existing) {
    return res.status(409).json({ message: 'Role key already exists' });
  }

  const role = await Role.create({
    key,
    label: req.body.label,
    description: req.body.description || '',
    isSystem: false,
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder || 100)
  });

  await seedDefaultRolePermissions();

  await writeAuditLog({
    actor: req.user._id,
    action: 'settings.role.created',
    entityType: 'Role',
    entityId: role._id,
    metadata: { key: role.key, label: role.label }
  });

  res.status(201).json({ message: 'Role created successfully', role: mapRole(role) });
});

export const updateRole = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const role = await Role.findById(req.params.id);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (role.isSystem && 'key' in req.body && slugify(req.body.key) !== role.key) {
    return res.status(400).json({ message: 'System role keys cannot be changed' });
  }

  if (role.key === 'admin' && req.body.isActive === false) {
    return res.status(400).json({ message: 'Admin role cannot be disabled' });
  }

  if ('key' in req.body && !role.isSystem) {
    const nextKey = slugify(req.body.key);
    if (!nextKey) {
      return res.status(400).json({ message: 'Role key cannot be empty' });
    }

    const existing = await Role.findOne({ key: nextKey, _id: { $ne: role._id } });
    if (existing) {
      return res.status(409).json({ message: 'Role key already exists' });
    }

    role.key = nextKey;
  }

  if ('label' in req.body) role.label = req.body.label;
  if ('description' in req.body) role.description = req.body.description || '';
  if ('isActive' in req.body) role.isActive = Boolean(req.body.isActive);
  if ('sortOrder' in req.body) role.sortOrder = Number(req.body.sortOrder || 100);
  await role.save();

  await seedDefaultRolePermissions();

  await writeAuditLog({
    actor: req.user._id,
    action: 'settings.role.updated',
    entityType: 'Role',
    entityId: role._id,
    metadata: { key: role.key, updatedFields: Object.keys(req.body) }
  });

  res.json({ message: 'Role updated successfully', role: mapRole(role) });
});

export const listMasterData = asyncHandler(async (req, res) => {
  const category = req.query.category;

  if (category) {
    const items = await getMasterDataByCategory(category, { includeInactive: true });
    return res.json({ category, items: items.map(mapMasterItem) });
  }

  const grouped = await getGroupedMasterData({ includeInactive: true });
  return res.json({
    items: Object.fromEntries(Object.entries(grouped).map(([key, values]) => [key, values.map(mapMasterItem)]))
  });
});

export const createMasterDataItem = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const category = slugify(req.body.category);
  const key = slugify(req.body.key || req.body.label);

  if (!category || !key) {
    return res.status(400).json({ message: 'category and label/key are required' });
  }

  const existing = await MasterDataItem.findOne({ category, key });
  if (existing) {
    return res.status(409).json({ message: 'Master data key already exists in this category' });
  }

  const item = await MasterDataItem.create({
    category,
    key,
    label: req.body.label,
    description: req.body.description || '',
    isSystem: false,
    isActive: req.body.isActive !== false,
    sortOrder: Number(req.body.sortOrder || 100),
    metadata: req.body.metadata || {}
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'settings.master.created',
    entityType: 'MasterDataItem',
    entityId: item._id,
    metadata: { category, key }
  });

  res.status(201).json({ message: 'Master data item created successfully', item: mapMasterItem(item) });
});

export const updateMasterDataItem = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const item = await MasterDataItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Master data item not found' });
  }

  if (item.isSystem && 'key' in req.body && slugify(req.body.key) !== item.key) {
    return res.status(400).json({ message: 'System master keys cannot be changed' });
  }

  if ('category' in req.body && !item.isSystem) {
    item.category = slugify(req.body.category);
  }
  if ('key' in req.body && !item.isSystem) {
    item.key = slugify(req.body.key);
  }
  if ('label' in req.body) item.label = req.body.label;
  if ('description' in req.body) item.description = req.body.description || '';
  if ('isActive' in req.body) item.isActive = Boolean(req.body.isActive);
  if ('sortOrder' in req.body) item.sortOrder = Number(req.body.sortOrder || 100);
  if ('metadata' in req.body) item.metadata = req.body.metadata || {};
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'settings.master.updated',
    entityType: 'MasterDataItem',
    entityId: item._id,
    metadata: { category: item.category, key: item.key, updatedFields: Object.keys(req.body) }
  });

  res.json({ message: 'Master data item updated successfully', item: mapMasterItem(item) });
});

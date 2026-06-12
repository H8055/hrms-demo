import { validationResult } from 'express-validator';
import { ACTION_KEYS, MODULE_KEYS, ROLE_KEYS } from '../config/permissions.js';
import { AuditLog } from '../models/AuditLog.js';
import { RolePermission } from '../models/RolePermission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import {
  getAllRolePermissions,
  getEffectivePermissionsForUser,
  getPermissionMeta,
  getRolePermissionMap,
  normalizePermissionInput,
  serializePermissionDocument,
  upsertRoleModulePermission
} from '../services/permission.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function ensureValidRoleAndModule(role, moduleKey) {
  if (!ROLE_KEYS.includes(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  if (!MODULE_KEYS.includes(moduleKey)) {
    const error = new Error('Invalid module');
    error.statusCode = 400;
    throw error;
  }
}

async function mapPermissionDocument(role, moduleKey) {
  const document = await RolePermission.findOne({ role, module: moduleKey }).populate('updatedBy', 'name email');

  if (!document) {
    return {
      role,
      module: moduleKey,
      enabled: false,
      showInSidebar: false,
      actions: [],
      updatedAt: null,
      updatedBy: null
    };
  }

  return serializePermissionDocument(document);
}

async function getPermissionAuditEntries(limit = 20) {
  const logs = await AuditLog.find({ action: { $regex: '^permissions\.' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email role');

  return logs.map((item) => ({
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
  }));
}

export const getMyPermissions = asyncHandler(async (req, res) => {
  const permissions = await getEffectivePermissionsForUser(req.user);
  res.json({ role: req.user.role, permissions });
});

export const getPermissionsMeta = asyncHandler(async (req, res) => {
  res.json(getPermissionMeta());
});

export const getAllPermissions = asyncHandler(async (req, res) => {
  const [permissionsByRole, auditLogs] = await Promise.all([
    getAllRolePermissions(),
    getPermissionAuditEntries(10)
  ]);

  res.json({
    meta: getPermissionMeta(),
    permissionsByRole,
    auditLogs
  });
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  const role = req.params.role;
  if (!ROLE_KEYS.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const permissions = await getRolePermissionMap(role);
  res.json({ role, locked: role === 'admin', permissions });
});

export const replaceRoleModulePermissions = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const role = req.params.role;
  const moduleKey = req.params.module;
  ensureValidRoleAndModule(role, moduleKey);

  const before = await getRolePermissionMap(role);
  const document = await upsertRoleModulePermission({
    role,
    moduleKey,
    data: {
      enabled: req.body.enabled,
      showInSidebar: req.body.showInSidebar,
      actions: req.body.actions
    },
    updatedBy: req.user._id
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'permissions.role_module.replaced',
    entityType: 'RolePermission',
    entityId: document._id,
    metadata: {
      role,
      module: moduleKey,
      previousValue: before[moduleKey],
      newValue: normalizePermissionInput(req.body)
    }
  });

  const saved = await RolePermission.findById(document._id).populate('updatedBy', 'name email');
  res.json({ message: `Permissions updated for ${role}/${moduleKey}`, permission: serializePermissionDocument(saved) });
});

export const toggleRoleModuleAction = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const role = req.params.role;
  const moduleKey = req.params.module;
  const action = req.params.action;
  ensureValidRoleAndModule(role, moduleKey);

  if (!ACTION_KEYS.includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const roleMap = await getRolePermissionMap(role);
  const current = roleMap[moduleKey] || { enabled: false, showInSidebar: false, actions: [] };
  const nextActions = req.body.enabled
    ? [...new Set([...current.actions, action])]
    : current.actions.filter((item) => item !== action);

  const document = await upsertRoleModulePermission({
    role,
    moduleKey,
    data: {
      enabled: current.enabled,
      showInSidebar: current.showInSidebar,
      actions: nextActions
    },
    updatedBy: req.user._id
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'permissions.action.toggled',
    entityType: 'RolePermission',
    entityId: document._id,
    metadata: {
      role,
      module: moduleKey,
      action,
      enabled: Boolean(req.body.enabled),
      previousValue: current.actions,
      newValue: nextActions
    }
  });

  const saved = await RolePermission.findById(document._id).populate('updatedBy', 'name email');
  res.json({ message: `${action} ${req.body.enabled ? 'enabled' : 'disabled'} for ${role}/${moduleKey}`, permission: serializePermissionDocument(saved) });
});

export const updateRoleModuleSidebar = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const role = req.params.role;
  const moduleKey = req.params.module;
  ensureValidRoleAndModule(role, moduleKey);

  const roleMap = await getRolePermissionMap(role);
  const current = roleMap[moduleKey] || { enabled: false, showInSidebar: false, actions: [] };

  const document = await upsertRoleModulePermission({
    role,
    moduleKey,
    data: {
      enabled: 'enabled' in req.body ? req.body.enabled : current.enabled,
      showInSidebar: req.body.showInSidebar,
      actions: current.actions
    },
    updatedBy: req.user._id
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'permissions.sidebar.updated',
    entityType: 'RolePermission',
    entityId: document._id,
    metadata: {
      role,
      module: moduleKey,
      previousValue: current.showInSidebar,
      newValue: Boolean(req.body.showInSidebar)
    }
  });

  const saved = await RolePermission.findById(document._id).populate('updatedBy', 'name email');
  res.json({ message: `Sidebar visibility updated for ${role}/${moduleKey}`, permission: serializePermissionDocument(saved) });
});

export const bulkUpdateRolePermissions = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { role, permissions } = req.body;
  if (!ROLE_KEYS.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (role === 'admin') {
    return res.status(403).json({ message: 'Admin permissions are locked and cannot be edited' });
  }

  const currentRoleMap = await getRolePermissionMap(role);
  const updatedItems = [];

  for (const moduleKey of MODULE_KEYS) {
    const nextValue = permissions?.[moduleKey];
    if (!nextValue) continue;

    const document = await upsertRoleModulePermission({
      role,
      moduleKey,
      data: nextValue,
      updatedBy: req.user._id
    });

    await writeAuditLog({
      actor: req.user._id,
      action: 'permissions.bulk.updated',
      entityType: 'RolePermission',
      entityId: document._id,
      metadata: {
        role,
        module: moduleKey,
        previousValue: currentRoleMap[moduleKey],
        newValue: normalizePermissionInput(nextValue)
      }
    });

    updatedItems.push(document._id);
  }

  const items = await RolePermission.find({ _id: { $in: updatedItems } }).populate('updatedBy', 'name email');
  res.json({
    message: `Bulk permissions updated for ${role}`,
    items: items.map(serializePermissionDocument)
  });
});

export const getPermissionAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const items = await getPermissionAuditEntries(limit);
  res.json({ items });
});

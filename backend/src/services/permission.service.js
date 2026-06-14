import { ACTION_KEYS, DEFAULT_ROLE_PERMISSIONS, MODULE_DEFINITIONS, MODULE_KEYS } from '../config/permissions.js';
import { RolePermission } from '../models/RolePermission.js';
import { getAllRoles, getRoleKeys } from './role.service.js';

function uniqueActions(actions = []) {
  return [...new Set((actions || []).filter((action) => ACTION_KEYS.includes(action)))];
}

function buildModuleMap(config) {
  return MODULE_KEYS.reduce((acc, moduleKey) => {
    const base = config?.[moduleKey] || { enabled: false, showInSidebar: false, actions: [] };
    acc[moduleKey] = {
      enabled: Boolean(base.enabled),
      showInSidebar: Boolean(base.showInSidebar),
      actions: uniqueActions(base.actions)
    };
    return acc;
  }, {});
}

function getDefaultModuleMapForRole(role) {
  if (role === 'admin') {
    return buildModuleMap(DEFAULT_ROLE_PERMISSIONS.admin);
  }

  return buildModuleMap(DEFAULT_ROLE_PERMISSIONS[role] || {});
}

export function normalizePermissionInput(input = {}) {
  return {
    enabled: Boolean(input.enabled),
    showInSidebar: Boolean(input.showInSidebar),
    actions: uniqueActions(input.actions)
  };
}

export async function seedDefaultRolePermissions() {
  const roleKeys = await getRoleKeys({ includeInactive: true });
  const operations = [];

  for (const role of roleKeys) {
    const moduleMap = getDefaultModuleMapForRole(role);

    for (const moduleKey of MODULE_KEYS) {
      const config = moduleMap[moduleKey] || { enabled: false, showInSidebar: false, actions: [] };
      operations.push(
        RolePermission.updateOne(
          { role, module: moduleKey },
          {
            $setOnInsert: {
              role,
              module: moduleKey,
              enabled: config.enabled,
              showInSidebar: config.showInSidebar,
              actions: config.actions
            }
          },
          { upsert: true }
        )
      );
    }
  }

  await Promise.all(operations);
}

export async function getRolePermissionDocuments(role) {
  return RolePermission.find({ role }).sort({ module: 1 });
}

export async function getRolePermissionMap(role) {
  const docs = await getRolePermissionDocuments(role);
  const byModule = Object.fromEntries(docs.map((doc) => [doc.module, normalizePermissionInput(doc)]));
  const defaults = getDefaultModuleMapForRole(role);

  return MODULE_KEYS.reduce((acc, moduleKey) => {
    acc[moduleKey] = byModule[moduleKey] || defaults[moduleKey] || { enabled: false, showInSidebar: false, actions: [] };
    return acc;
  }, {});
}

export async function getAllRolePermissions() {
  const docs = await RolePermission.find({}).sort({ role: 1, module: 1 });
  const roles = await getAllRoles({ includeInactive: true });
  const grouped = {};

  for (const role of roles) {
    grouped[role.key] = getDefaultModuleMapForRole(role.key);
  }

  docs.forEach((doc) => {
    if (!grouped[doc.role]) {
      grouped[doc.role] = getDefaultModuleMapForRole(doc.role);
    }
    grouped[doc.role][doc.module] = normalizePermissionInput(doc);
  });

  return grouped;
}

export async function getEffectivePermissionsForUser(user) {
  if (!user) return {};
  return getRolePermissionMap(user.role);
}

export async function canUserPerform(user, moduleKey, action = 'view') {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const permissions = await getRolePermissionMap(user.role);
  const modulePermission = permissions[moduleKey];

  if (!modulePermission?.enabled) return false;
  return modulePermission.actions.includes(action);
}

export async function getRolesWithPermission(moduleKey, action = 'view') {
  const roles = await getAllRoles({ includeInactive: false });
  const allowed = [];

  for (const role of roles) {
    if (role.key === 'admin') {
      allowed.push(role.key);
      continue;
    }

    const permissionMap = await getRolePermissionMap(role.key);
    const modulePermission = permissionMap[moduleKey];
    if (modulePermission?.enabled && modulePermission.actions.includes(action)) {
      allowed.push(role.key);
    }
  }

  return allowed;
}

export async function upsertRoleModulePermission({ role, moduleKey, data, updatedBy = null }) {
  if (role === 'admin') {
    throw new Error('Admin permissions are locked and cannot be edited');
  }

  const normalized = normalizePermissionInput(data);

  const document = await RolePermission.findOneAndUpdate(
    { role, module: moduleKey },
    {
      $set: {
        role,
        module: moduleKey,
        enabled: normalized.enabled,
        showInSidebar: normalized.showInSidebar,
        actions: normalized.actions,
        updatedBy
      }
    },
    { new: true, upsert: true }
  );

  return document;
}

export function serializePermissionDocument(doc) {
  return {
    id: doc?._id,
    role: doc?.role,
    module: doc?.module,
    enabled: Boolean(doc?.enabled),
    showInSidebar: Boolean(doc?.showInSidebar),
    actions: uniqueActions(doc?.actions),
    updatedAt: doc?.updatedAt,
    updatedBy: doc?.updatedBy
      ? {
          id: doc.updatedBy._id,
          name: doc.updatedBy.name,
          email: doc.updatedBy.email
        }
      : null
  };
}

export async function getPermissionMeta() {
  const roles = await getAllRoles({ includeInactive: true });
  return {
    roles: roles.map((role) => role.key),
    roleDetails: roles.map((role) => ({
      key: role.key,
      label: role.label,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      sortOrder: role.sortOrder
    })),
    actions: ACTION_KEYS,
    modules: MODULE_DEFINITIONS
  };
}

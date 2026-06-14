import { Role } from '../models/Role.js';

export const DEFAULT_ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'Full platform access and governance control',
    isSystem: true,
    isActive: true,
    sortOrder: 1
  },
  {
    key: 'hr',
    label: 'HR',
    description: 'Human resources operations and approvals',
    isSystem: true,
    isActive: true,
    sortOrder: 2
  },
  {
    key: 'accounts',
    label: 'Accounts',
    description: 'Finance and payout processing responsibilities',
    isSystem: true,
    isActive: true,
    sortOrder: 3
  },
  {
    key: 'manager',
    label: 'Manager',
    description: 'Line manager with team-level approval responsibilities',
    isSystem: true,
    isActive: true,
    sortOrder: 4
  },
  {
    key: 'employee',
    label: 'Employee',
    description: 'Default self-service employee role',
    isSystem: true,
    isActive: true,
    sortOrder: 5
  }
];

export async function seedDefaultRoles() {
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      Role.updateOne(
        { key: role.key },
        {
          $setOnInsert: role
        },
        { upsert: true }
      )
    )
  );
}

export async function getAllRoles({ includeInactive = true } = {}) {
  const query = includeInactive ? {} : { isActive: true };
  return Role.find(query).sort({ sortOrder: 1, label: 1 });
}

export async function getRoleKeys({ includeInactive = false } = {}) {
  const roles = await getAllRoles({ includeInactive });
  return roles.map((role) => role.key);
}

export async function roleExists(key) {
  if (!key) return false;
  return Boolean(await Role.findOne({ key: key.toLowerCase(), isActive: true }));
}

export async function getDefaultRoleKey() {
  const employeeRole = await Role.findOne({ key: 'employee', isActive: true });
  if (employeeRole) return employeeRole.key;

  const firstActiveRole = await Role.findOne({ isActive: true }).sort({ sortOrder: 1, label: 1 });
  return firstActiveRole?.key || 'employee';
}

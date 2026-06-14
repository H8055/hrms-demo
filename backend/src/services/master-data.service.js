import { MasterDataItem } from '../models/MasterDataItem.js';

export const MASTER_DATA_DEFAULTS = {
  departments: [
    { key: 'administration', label: 'Administration', isSystem: true, sortOrder: 1 },
    { key: 'human-resources', label: 'Human Resources', isSystem: true, sortOrder: 2 },
    { key: 'engineering', label: 'Engineering', isSystem: true, sortOrder: 3 },
    { key: 'finance', label: 'Finance', isSystem: true, sortOrder: 4 },
    { key: 'accounts', label: 'Accounts', isSystem: true, sortOrder: 5 }
  ],
  designations: [
    { key: 'hrms-admin', label: 'HRMS Admin', isSystem: true, sortOrder: 1 },
    { key: 'hr-manager', label: 'HR Manager', isSystem: true, sortOrder: 2 },
    { key: 'line-manager', label: 'Line Manager', isSystem: true, sortOrder: 3 },
    { key: 'software-engineer', label: 'Software Engineer', isSystem: true, sortOrder: 4 },
    { key: 'finance-analyst', label: 'Finance Analyst', isSystem: true, sortOrder: 5 }
  ],
  'employment-statuses': [
    { key: 'active', label: 'Active', isSystem: true, sortOrder: 1 },
    { key: 'onboarded', label: 'Onboarded', isSystem: true, sortOrder: 2 },
    { key: 'exited', label: 'Exited', isSystem: true, sortOrder: 3 }
  ],
  'leave-types': [
    { key: 'annual', label: 'Annual', isSystem: true, sortOrder: 1, metadata: { defaultBalance: 18 } },
    { key: 'sick', label: 'Sick', isSystem: true, sortOrder: 2, metadata: { defaultBalance: 8 } },
    { key: 'casual', label: 'Casual', isSystem: true, sortOrder: 3, metadata: { defaultBalance: 6 } },
    { key: 'unpaid', label: 'Unpaid', isSystem: true, sortOrder: 4, metadata: { defaultBalance: 0 } }
  ],
  'payment-modes': [
    { key: 'bank', label: 'Bank', isSystem: true, sortOrder: 1 },
    { key: 'cash', label: 'Cash', isSystem: true, sortOrder: 2 },
    { key: 'upi', label: 'UPI', isSystem: true, sortOrder: 3 }
  ],
  shifts: [
    { key: 'general', label: 'General Shift', isSystem: true, sortOrder: 1, metadata: { startTime: '09:00', endTime: '18:00' } },
    { key: 'night', label: 'Night Shift', isSystem: true, sortOrder: 2, metadata: { startTime: '18:00', endTime: '03:00' } }
  ],
  holidays: [
    { key: 'republic-day', label: 'Republic Day', isSystem: true, sortOrder: 1, metadata: { date: '2026-01-26' } },
    { key: 'independence-day', label: 'Independence Day', isSystem: true, sortOrder: 2, metadata: { date: '2026-08-15' } },
    { key: 'gandhi-jayanti', label: 'Gandhi Jayanti', isSystem: true, sortOrder: 3, metadata: { date: '2026-10-02' } }
  ],
  'payroll-components': [
    { key: 'basic', label: 'Basic', isSystem: true, sortOrder: 1 },
    { key: 'hra', label: 'HRA', isSystem: true, sortOrder: 2 },
    { key: 'allowances', label: 'Allowances', isSystem: true, sortOrder: 3 }
  ],
  'deduction-types': [
    { key: 'statutory', label: 'Statutory', isSystem: true, sortOrder: 1 },
    { key: 'other', label: 'Other', isSystem: true, sortOrder: 2 },
    { key: 'advance', label: 'Advance Deduction', isSystem: true, sortOrder: 3 }
  ],
  'document-types': [
    { key: 'id-proof', label: 'ID Proof', isSystem: true, sortOrder: 1 },
    { key: 'address-proof', label: 'Address Proof', isSystem: true, sortOrder: 2 },
    { key: 'contract', label: 'Employment Contract', isSystem: true, sortOrder: 3 },
    { key: 'certificate', label: 'Certificate', isSystem: true, sortOrder: 4 }
  ]
};

export async function seedDefaultMasterData() {
  const ops = [];

  for (const [category, items] of Object.entries(MASTER_DATA_DEFAULTS)) {
    for (const item of items) {
      ops.push(
        MasterDataItem.updateOne(
          { category, key: item.key },
          {
            $setOnInsert: {
              category,
              ...item,
              description: item.description || ''
            }
          },
          { upsert: true }
        )
      );
    }
  }

  await Promise.all(ops);
}

export async function getMasterCategories() {
  return Object.keys(MASTER_DATA_DEFAULTS);
}

export async function getGroupedMasterData({ includeInactive = true } = {}) {
  const query = includeInactive ? {} : { isActive: true };
  const items = await MasterDataItem.find(query).sort({ category: 1, sortOrder: 1, label: 1 });

  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export async function getMasterDataByCategory(category, { includeInactive = true } = {}) {
  const query = { category };
  if (!includeInactive) query.isActive = true;
  return MasterDataItem.find(query).sort({ sortOrder: 1, label: 1 });
}

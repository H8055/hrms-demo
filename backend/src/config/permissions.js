export const ROLE_KEYS = ['admin', 'hr', 'accounts', 'manager', 'employee'];
export const SYSTEM_ROLE_KEYS = [...ROLE_KEYS];
export const ACTION_KEYS = ['view', 'create', 'edit', 'delete', 'approve', 'pay', 'export'];

export const MODULE_DEFINITIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Landing dashboard, widgets, and overview cards',
    supportsSidebar: true
  },
  {
    key: 'employee',
    label: 'Employees',
    description: 'Employee directory, profiles, onboarding, and org chart',
    supportsSidebar: true
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Check-in/out, attendance history, and regularization',
    supportsSidebar: true
  },
  {
    key: 'leave',
    label: 'Leave',
    description: 'Leave application, balances, and approvals',
    supportsSidebar: true
  },
  {
    key: 'advance',
    label: 'Advances',
    description: 'Advance requests, approvals, payment processing, and history',
    supportsSidebar: true
  },
  {
    key: 'payroll',
    label: 'Payroll',
    description: 'Salary structures, payroll runs, and payslips',
    supportsSidebar: true
  },
  {
    key: 'performance',
    label: 'Performance',
    description: 'Performance reviews, goals, and ratings',
    supportsSidebar: true
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Cross-module reports and exports',
    supportsSidebar: true
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Company settings and system configuration',
    supportsSidebar: true
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Role permission matrix, sidebar visibility, and permission governance',
    supportsSidebar: true
  }
];

export const MODULE_KEYS = MODULE_DEFINITIONS.map((item) => item.key);

const ALL_ACTIONS = [...ACTION_KEYS];

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    dashboard: { enabled: true, showInSidebar: true, actions: ['view'] },
    employee: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    attendance: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    leave: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    advance: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    payroll: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    performance: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    reports: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    settings: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS },
    permissions: { enabled: true, showInSidebar: true, actions: ALL_ACTIONS }
  },
  hr: {
    dashboard: { enabled: true, showInSidebar: true, actions: ['view'] },
    employee: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'export'] },
    attendance: { enabled: true, showInSidebar: true, actions: ['view', 'edit', 'approve', 'export'] },
    leave: { enabled: true, showInSidebar: true, actions: ['view', 'approve', 'export'] },
    advance: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'approve', 'export'] },
    payroll: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'approve', 'export'] },
    performance: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'export'] },
    reports: { enabled: true, showInSidebar: true, actions: ['view', 'export'] },
    settings: { enabled: true, showInSidebar: true, actions: ['view', 'edit'] },
    permissions: { enabled: false, showInSidebar: false, actions: [] }
  },
  accounts: {
    dashboard: { enabled: true, showInSidebar: true, actions: ['view'] },
    employee: { enabled: false, showInSidebar: false, actions: [] },
    attendance: { enabled: false, showInSidebar: false, actions: [] },
    leave: { enabled: false, showInSidebar: false, actions: [] },
    advance: { enabled: true, showInSidebar: true, actions: ['view', 'pay', 'export'] },
    payroll: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'approve', 'export'] },
    performance: { enabled: false, showInSidebar: false, actions: [] },
    reports: { enabled: true, showInSidebar: true, actions: ['view', 'export'] },
    settings: { enabled: false, showInSidebar: false, actions: [] },
    permissions: { enabled: false, showInSidebar: false, actions: [] }
  },
  manager: {
    dashboard: { enabled: true, showInSidebar: true, actions: ['view'] },
    employee: { enabled: true, showInSidebar: true, actions: ['view'] },
    attendance: { enabled: true, showInSidebar: true, actions: ['view', 'approve'] },
    leave: { enabled: true, showInSidebar: true, actions: ['view', 'approve'] },
    advance: { enabled: true, showInSidebar: true, actions: ['view', 'approve'] },
    payroll: { enabled: false, showInSidebar: false, actions: [] },
    performance: { enabled: true, showInSidebar: true, actions: ['view', 'create', 'edit', 'approve'] },
    reports: { enabled: true, showInSidebar: true, actions: ['view'] },
    settings: { enabled: false, showInSidebar: false, actions: [] },
    permissions: { enabled: false, showInSidebar: false, actions: [] }
  },
  employee: {
    dashboard: { enabled: true, showInSidebar: true, actions: ['view'] },
    employee: { enabled: true, showInSidebar: true, actions: ['view'] },
    attendance: { enabled: true, showInSidebar: true, actions: ['view', 'create'] },
    leave: { enabled: true, showInSidebar: true, actions: ['view', 'create'] },
    advance: { enabled: true, showInSidebar: true, actions: ['view', 'create'] },
    payroll: { enabled: true, showInSidebar: true, actions: ['view'] },
    performance: { enabled: true, showInSidebar: true, actions: ['view', 'edit'] },
    reports: { enabled: false, showInSidebar: false, actions: [] },
    settings: { enabled: false, showInSidebar: false, actions: [] },
    permissions: { enabled: false, showInSidebar: false, actions: [] }
  }
};

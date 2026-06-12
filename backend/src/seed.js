import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import { AdvanceRequest } from './models/AdvanceRequest.js';
import { AttendanceRecord } from './models/AttendanceRecord.js';
import { AuditLog } from './models/AuditLog.js';
import { CompanySettings } from './models/CompanySettings.js';
import { LeaveRequest } from './models/LeaveRequest.js';
import { Notification } from './models/Notification.js';
import { PayrollRecord } from './models/PayrollRecord.js';
import { PerformanceReview } from './models/PerformanceReview.js';
import { SalaryStructure } from './models/SalaryStructure.js';
import { RolePermission } from './models/RolePermission.js';
import { User } from './models/User.js';
import { seedDefaultRolePermissions } from './services/permission.service.js';

async function createUser(payload) {
  const passwordHash = await bcrypt.hash('Password@123', 10);
  return User.create({ ...payload, passwordHash });
}

async function seed() {
  await connectDb();

  await Promise.all([
    AdvanceRequest.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    AuditLog.deleteMany({}),
    CompanySettings.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Notification.deleteMany({}),
    PayrollRecord.deleteMany({}),
    PerformanceReview.deleteMany({}),
    SalaryStructure.deleteMany({}),
    RolePermission.deleteMany({}),
    User.deleteMany({})
  ]);

  const admin = await createUser({
    name: 'Super Admin',
    email: 'admin@example.com',
    role: 'admin',
    department: 'Administration',
    designation: 'HRMS Admin',
    employeeCode: 'ADM-001'
  });

  const hr = await createUser({
    name: 'Priya HR',
    email: 'hr@example.com',
    role: 'hr',
    department: 'Human Resources',
    designation: 'HR Manager',
    employeeCode: 'HR-001'
  });

  const manager = await createUser({
    name: 'Arjun Manager',
    email: 'manager@example.com',
    role: 'manager',
    department: 'Engineering',
    designation: 'Line Manager',
    employeeCode: 'MGR-001'
  });

  const employee = await createUser({
    name: 'Riya Employee',
    email: 'employee@example.com',
    role: 'employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    employeeCode: 'EMP-001',
    manager: manager._id,
    joiningDate: new Date('2025-01-10')
  });

  const employee2 = await createUser({
    name: 'Neha Analyst',
    email: 'neha@example.com',
    role: 'employee',
    department: 'Finance',
    designation: 'Finance Analyst',
    employeeCode: 'EMP-002',
    manager: hr._id,
    joiningDate: new Date('2025-03-15')
  });

  await CompanySettings.create({
    companyName: 'Arena HRMS Demo',
    companyEmail: 'info@example.com',
    companyPhone: '+91 90000 00000',
    address: 'Bengaluru, India',
    holidays: ['2026-01-26', '2026-08-15', '2026-10-02']
  });

  await SalaryStructure.insertMany([
    { user: employee._id, basic: 40000, hra: 16000, allowances: 9000, statutoryDeductions: 4500, otherDeductions: 1000 },
    { user: employee2._id, basic: 42000, hra: 15000, allowances: 8000, statutoryDeductions: 4300, otherDeductions: 900 }
  ]);

  const advance = await AdvanceRequest.create({
    requestedBy: employee._id,
    amount: 25000,
    reason: 'Medical emergency support',
    repaymentPlan: 'Deduct over 5 salary cycles',
    status: 'approved',
    approvedBy: hr._id,
    processedBy: hr._id,
    approvedAt: new Date()
  });

  await AdvanceRequest.create({
    requestedBy: employee2._id,
    amount: 15000,
    reason: 'Family support',
    repaymentPlan: 'Deduct over 3 salary cycles',
    status: 'pending'
  });

  await AttendanceRecord.insertMany([
    { user: employee._id, date: new Date(), checkIn: new Date(), status: 'present', source: 'self' },
    { user: employee2._id, date: new Date(), status: 'on-leave', source: 'system' }
  ]);

  await LeaveRequest.create({
    user: employee2._id,
    leaveType: 'annual',
    fromDate: new Date(),
    toDate: new Date(),
    days: 1,
    reason: 'Family event',
    status: 'approved',
    decidedBy: hr._id,
    decidedAt: new Date()
  });

  await PayrollRecord.create({
    user: employee._id,
    month: new Date().toISOString().slice(0, 7),
    grossPay: 65000,
    statutoryDeductions: 4500,
    otherDeductions: 1000,
    advanceDeduction: advance.amount,
    totalDeductions: 30500,
    netPay: 34500,
    status: 'paid',
    paidAt: new Date(),
    generatedBy: admin._id
  });

  await PerformanceReview.create({
    user: employee._id,
    reviewer: manager._id,
    cycle: '2026 H1',
    goals: ['Improve delivery predictability', 'Mentor juniors', 'Own HRMS sprint module'],
    rating: 4.3,
    feedback: 'Strong ownership and consistent delivery.',
    status: 'completed'
  });

  await seedDefaultRolePermissions();

  console.log('Seed completed');
  console.log('Login users:');
  console.log('admin@example.com / Password@123');
  console.log('hr@example.com / Password@123');
  console.log('manager@example.com / Password@123');
  console.log('employee@example.com / Password@123');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

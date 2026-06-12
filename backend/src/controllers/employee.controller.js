import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { sendMail } from '../services/mail.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function mapEmployee(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    employeeCode: user.employeeCode,
    phone: user.phone,
    address: user.address,
    joiningDate: user.joiningDate,
    employmentStatus: user.employmentStatus,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    leaveBalances: user.leaveBalances,
    bankDetails: user.bankDetails,
    manager: user.manager
      ? {
          id: user.manager._id,
          name: user.manager.name,
          email: user.manager.email,
          designation: user.manager.designation
        }
      : null,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

function buildSearchQuery(q) {
  if (!q?.trim()) return null;
  const regex = new RegExp(q.trim(), 'i');
  return {
    $or: [
      { name: regex },
      { email: regex },
      { department: regex },
      { designation: regex },
      { employeeCode: regex },
      { phone: regex }
    ]
  };
}

export const listEmployees = asyncHandler(async (req, res) => {
  const query = {};
  const searchQuery = buildSearchQuery(req.query.q);
  if (searchQuery) Object.assign(query, searchQuery);
  if (req.query.role) query.role = req.query.role;
  if (req.query.status) query.employmentStatus = req.query.status;

  const items = await User.find(query)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .sort({ createdAt: -1 })
    .populate('manager', 'name email designation');

  res.json({ items: items.map(mapEmployee) });
});

export const getMyEmployeeProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  res.json({ employee: mapEmployee(user) });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  if (!user) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  res.json({ employee: mapEmployee(user) });
});

export const createEmployee = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const {
    name,
    email,
    password,
    role,
    department,
    designation,
    employeeCode,
    phone,
    address,
    joiningDate,
    manager,
    emergencyContactName,
    emergencyContactPhone
  } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);

  const employee = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'employee',
    department: department || '',
    designation: designation || '',
    employeeCode: employeeCode || '',
    phone: phone || '',
    address: address || '',
    joiningDate: joiningDate || null,
    manager: manager || null,
    emergencyContactName: emergencyContactName || '',
    emergencyContactPhone: emergencyContactPhone || ''
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.created',
    entityType: 'User',
    entityId: employee._id,
    metadata: { email: employee.email, role: employee.role }
  });

  await sendMail({
    to: employee.email,
    subject: 'Welcome to HRMS',
    text: `Your HRMS profile has been created. Temporary password: ${password || 'Password@123'}`
  });

  const saved = await User.findById(employee._id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  res.status(201).json({ message: 'Employee created successfully', employee: mapEmployee(saved) });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const fields = [
    'name',
    'department',
    'designation',
    'employeeCode',
    'phone',
    'address',
    'joiningDate',
    'manager',
    'employmentStatus',
    'emergencyContactName',
    'emergencyContactPhone',
    'role'
  ];

  fields.forEach((field) => {
    if (field in req.body) {
      employee[field] = req.body[field];
    }
  });

  if ('leaveBalances' in req.body) {
    employee.leaveBalances = {
      ...employee.leaveBalances,
      ...req.body.leaveBalances
    };
  }

  if ('bankDetails' in req.body) {
    employee.bankDetails = {
      ...employee.bankDetails,
      ...req.body.bankDetails
    };
  }

  if ('isActive' in req.body) {
    employee.isActive = Boolean(req.body.isActive);
  }

  await employee.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.updated',
    entityType: 'User',
    entityId: employee._id,
    metadata: { updatedFields: Object.keys(req.body) }
  });

  const saved = await User.findById(employee._id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  res.json({ message: 'Employee updated successfully', employee: mapEmployee(saved) });
});

export const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  employee.employmentStatus = 'exited';
  employee.isActive = false;
  await employee.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.deactivated',
    entityType: 'User',
    entityId: employee._id,
    metadata: { email: employee.email }
  });

  res.json({ message: 'Employee marked as exited' });
});

export const getOrgChart = asyncHandler(async (req, res) => {
  const items = await User.find({ isActive: true })
    .select('name designation department manager role')
    .populate('manager', 'name');

  res.json({
    items: items.map((item) => ({
      id: item._id,
      name: item.name,
      designation: item.designation,
      department: item.department,
      role: item.role,
      managerName: item.manager?.name || null,
      managerId: item.manager?._id || null
    }))
  });
});

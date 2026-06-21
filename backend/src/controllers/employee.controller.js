import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { EmployeeDocument } from '../models/EmployeeDocument.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { sendMail } from '../services/mail.service.js';
import { getDefaultRoleKey, roleExists } from '../services/role.service.js';
import { createNotification } from '../services/notification.service.js';
import { saveDocument, readDocument, removeDocument, getDownloadUrl } from '../services/storage.service.js';
import { refreshCompletion, computeCompletion } from '../services/completion.service.js';
import { canAccessCategory, visibleCategoriesForRole, SENSITIVE_NUMBER_SUBTYPES } from '../config/employeeProfile.js';

// Masks a regulated identifier, keeping only the last 4 characters visible.
function maskNumber(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (trimmed.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

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
    confirmationDate: user.confirmationDate,
    probationStatus: user.probationStatus,
    employmentStatus: user.employmentStatus,
    photoUrl: user.photoUrl,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    bloodGroup: user.bloodGroup,
    maritalStatus: user.maritalStatus,
    location: user.location,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    profileCompletion: user.profileCompletion,
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

function mapDocument(item) {
  return {
    id: item._id,
    category: item.category,
    subType: item.subType,
    originalName: item.originalName,
    mimeType: item.mimeType,
    size: item.size,
    documentNumber: SENSITIVE_NUMBER_SUBTYPES.includes(item.subType)
      ? maskNumber(item.documentNumber)
      : item.documentNumber,
    issueDate: item.issueDate,
    expiryDate: item.expiryDate,
    status: item.status,
    remarks: item.remarks,
    version: item.version,
    isCurrent: item.isCurrent,
    generatedLetter: item.generatedLetter,
    // Confidential files are streamed through an authenticated API route — no public URL.
    downloadUrl: `/api/employees/${item.user}/documents/${item._id}/download`,
    verifiedBy: item.verifiedBy
      ? { id: item.verifiedBy._id, name: item.verifiedBy.name }
      : null,
    verifiedAt: item.verifiedAt,
    uploadedAt: item.createdAt,
    uploadedBy: item.uploadedBy
      ? {
          id: item.uploadedBy._id,
          name: item.uploadedBy.name,
          email: item.uploadedBy.email
        }
      : null
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

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function buildImportRecords(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

const DIRECTORY_ROLES = ['admin', 'hr', 'manager'];

export const listEmployees = asyncHandler(async (req, res) => {
  if (!DIRECTORY_ROLES.includes(req.user.role)) {
    // Non-privileged users can only see their own record
    const self = await User.findById(req.user._id)
      .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
      .populate('manager', 'name email designation');
    return res.json({ items: self ? [mapEmployee(self)] : [] });
  }

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

export const exportEmployeesCsv = asyncHandler(async (req, res) => {
  const items = await User.find({})
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .sort({ createdAt: -1 })
    .populate('manager', 'name email designation');

  const headers = ['name', 'email', 'role', 'department', 'designation', 'employeeCode', 'phone', 'joiningDate', 'employmentStatus', 'manager'];
  const rows = [headers.join(',')];

  items.forEach((item) => {
    rows.push(
      [
        item.name,
        item.email,
        item.role,
        item.department,
        item.designation,
        item.employeeCode,
        item.phone,
        item.joiningDate ? new Date(item.joiningDate).toISOString().slice(0, 10) : '',
        item.employmentStatus,
        item.manager?.name || ''
      ]
        .map(csvEscape)
        .join(',')
    );
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
  res.send(rows.join('\n'));
});

export const importEmployeesCsv = asyncHandler(async (req, res) => {
  const csvText = req.body.csvText || '';
  if (!csvText.trim()) {
    return res.status(400).json({ message: 'csvText is required' });
  }

  const records = buildImportRecords(csvText);
  const createdEmployees = [];
  const skipped = [];

  for (const record of records) {
    const email = record.email?.toLowerCase();
    if (!email) {
      skipped.push({ reason: 'Missing email', record });
      continue;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      skipped.push({ reason: 'Email already exists', email });
      continue;
    }

    const role = record.role || (await getDefaultRoleKey());
    if (!(await roleExists(role))) {
      skipped.push({ reason: `Invalid role: ${role}`, email });
      continue;
    }

    const passwordHash = await bcrypt.hash(record.password || 'Password@123', 10);
    const employee = await User.create({
      name: record.name || record.email,
      email,
      passwordHash,
      role,
      department: record.department || '',
      designation: record.designation || '',
      employeeCode: record.employeecode || record.employeeCode || '',
      phone: record.phone || '',
      joiningDate: record.joiningdate || null,
      employmentStatus: record.employmentstatus || 'active'
    });

    createdEmployees.push(employee._id.toString());
  }

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.import_csv',
    entityType: 'User',
    entityId: req.user._id,
    metadata: { createdCount: createdEmployees.length, skippedCount: skipped.length }
  });

  res.status(201).json({
    message: 'CSV import processed',
    createdCount: createdEmployees.length,
    skipped
  });
});

export const getMyEmployeeProfile = asyncHandler(async (req, res) => {
  // Keep the cached completion snapshot fresh for the self-service view.
  await refreshCompletion(req.user._id, { notifyOnDrop: false });

  const user = await User.findById(req.user._id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  res.json({ employee: mapEmployee(user) });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  if (!DIRECTORY_ROLES.includes(req.user.role) && req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only view your own profile' });
  }

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
    emergencyContactPhone,
    employmentStatus
  } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);
  const assignedRole = role || (await getDefaultRoleKey());

  if (!(await roleExists(assignedRole))) {
    return res.status(400).json({ message: 'Selected role does not exist or is inactive' });
  }

  const employee = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: assignedRole,
    department: department || '',
    designation: designation || '',
    employeeCode: employeeCode || '',
    phone: phone || '',
    address: address || '',
    joiningDate: joiningDate || null,
    manager: manager || null,
    emergencyContactName: emergencyContactName || '',
    emergencyContactPhone: emergencyContactPhone || '',
    employmentStatus: employmentStatus || 'active'
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
    'photoUrl',
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'maritalStatus',
    'location',
    'joiningDate',
    'confirmationDate',
    'probationStatus',
    'manager',
    'employmentStatus',
    'emergencyContactName',
    'emergencyContactPhone',
    'role'
  ];

  for (const field of fields) {
    if (!(field in req.body)) continue;

    if (field === 'role') {
      if (!(await roleExists(req.body[field]))) {
        return res.status(400).json({ message: 'Selected role does not exist or is inactive' });
      }
    }

    employee[field] = req.body[field];
  }

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

  // Recompute completion since profile fields may have changed.
  await refreshCompletion(employee._id);

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

function isOwner(req) {
  return req.params.id === req.user._id.toString();
}

export const listEmployeeDocuments = asyncHandler(async (req, res) => {
  const owner = isOwner(req);
  if (!DIRECTORY_ROLES.includes(req.user.role) && !owner && req.user.role !== 'accounts') {
    return res.status(403).json({ message: 'You can only access your own documents' });
  }

  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const query = { user: employee._id };
  // Non-owners only see categories their role is allowed to view (e.g. accounts -> salary).
  if (!owner) {
    const categories = visibleCategoriesForRole(req.user.role);
    query.category = { $in: categories };
  }

  const items = await EmployeeDocument.find(query)
    .sort({ isCurrent: -1, createdAt: -1 })
    .populate('uploadedBy', 'name email')
    .populate('verifiedBy', 'name');

  res.json({ items: items.map(mapDocument) });
});

export const uploadEmployeeDocument = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'file is required' });
  }

  const category = req.body.category || 'general';
  const subType = req.body.subType || (category === 'general' ? 'general' : '');

  const stored = await saveDocument({
    buffer: req.file.buffer,
    employeeId: employee._id.toString(),
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    timestamp: Date.now()
  });

  // Replace flow: supersede the current document of the same category+subType.
  let version = 1;
  if (req.body.replace === 'true' && subType) {
    const previous = await EmployeeDocument.findOne({
      user: employee._id,
      category,
      subType,
      isCurrent: true
    }).sort({ version: -1 });
    if (previous) {
      previous.isCurrent = false;
      await previous.save();
      version = previous.version + 1;
    }
  }

  const document = await EmployeeDocument.create({
    user: employee._id,
    category,
    subType,
    originalName: req.file.originalname,
    storedName: stored.storedName,
    mimeType: req.file.mimetype,
    size: req.file.size,
    relativePath: stored.relativePath,
    storageProvider: stored.storageProvider,
    documentNumber: req.body.documentNumber || '',
    issueDate: req.body.issueDate || null,
    expiryDate: req.body.expiryDate || null,
    version,
    isCurrent: true,
    uploadedBy: req.user._id
  });

  await refreshCompletion(employee._id);

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.document.uploaded',
    entityType: 'EmployeeDocument',
    entityId: document._id,
    metadata: { userId: employee._id.toString(), category: document.category, subType }
  });

  // Notify the employee a new document was added (unless they uploaded it themselves).
  if (!isOwner(req)) {
    await createNotification({
      recipient: employee._id,
      type: 'document.uploaded',
      title: 'New document added',
      message: `A ${subType || category} document was uploaded to your profile.`,
      link: '/profile',
      relatedEntityType: 'EmployeeDocument',
      relatedEntityId: document._id
    });
  }

  const saved = await EmployeeDocument.findById(document._id).populate('uploadedBy', 'name email');
  res.status(201).json({ message: 'Document uploaded successfully', document: mapDocument(saved) });
});

export const downloadEmployeeDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findOne({ _id: req.params.documentId, user: req.params.id });
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const owner = isOwner(req);
  if (!canAccessCategory(req.user.role, document.category, owner)) {
    return res.status(403).json({ message: 'You do not have access to this document' });
  }

  // Prefer a signed URL when the storage backend supports it (Spaces).
  const signedUrl = await getDownloadUrl({ relativePath: document.relativePath, storageProvider: document.storageProvider });

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.document.viewed',
    entityType: 'EmployeeDocument',
    entityId: document._id,
    metadata: { userId: req.params.id, category: document.category }
  });

  if (signedUrl) {
    return res.json({ url: signedUrl });
  }

  const buffer = await readDocument({ relativePath: document.relativePath, storageProvider: document.storageProvider });
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
  res.send(buffer);
});

export const verifyEmployeeDocument = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be "verified" or "rejected"' });
  }

  const document = await EmployeeDocument.findOne({ _id: req.params.documentId, user: req.params.id });
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  document.status = status;
  document.remarks = remarks || '';
  document.verifiedBy = req.user._id;
  document.verifiedAt = new Date();
  await document.save();

  // Rejected KYC may lower completion; recompute and notify employee.
  await refreshCompletion(document.user);

  await writeAuditLog({
    actor: req.user._id,
    action: `employee.document.${status}`,
    entityType: 'EmployeeDocument',
    entityId: document._id,
    metadata: { userId: req.params.id, category: document.category, remarks: remarks || '' }
  });

  await createNotification({
    recipient: document.user,
    type: 'document.verification',
    title: status === 'verified' ? 'Document verified' : 'Document rejected',
    message:
      status === 'verified'
        ? `Your ${document.subType || document.category} document has been verified.`
        : `Your ${document.subType || document.category} document was rejected. ${remarks ? 'Reason: ' + remarks : ''}`,
    link: '/profile',
    relatedEntityType: 'EmployeeDocument',
    relatedEntityId: document._id
  });

  const saved = await EmployeeDocument.findById(document._id)
    .populate('uploadedBy', 'name email')
    .populate('verifiedBy', 'name');
  res.json({ message: `Document ${status}`, document: mapDocument(saved) });
});

export const deleteEmployeeDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findOne({ _id: req.params.documentId, user: req.params.id });
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  await removeDocument({ relativePath: document.relativePath, storageProvider: document.storageProvider });
  await document.deleteOne();
  await refreshCompletion(req.params.id);

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.document.deleted',
    entityType: 'EmployeeDocument',
    entityId: document._id,
    metadata: { userId: req.params.id, category: document.category }
  });

  res.json({ message: 'Document deleted successfully' });
});

export const getEmployeeCompletion = asyncHandler(async (req, res) => {
  if (!DIRECTORY_ROLES.includes(req.user.role) && !isOwner(req)) {
    return res.status(403).json({ message: 'You can only view your own completion' });
  }

  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const result = await computeCompletion(employee);
  res.json({ completion: result });
});

export const changeEmployeeEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required' });
  }

  const conflict = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
  if (conflict) {
    return res.status(409).json({ message: 'This email is already in use by another account' });
  }

  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const oldEmail = employee.email;
  employee.email = email.toLowerCase();
  employee.refreshToken = null; // force re-login with new email
  await employee.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'employee.email_changed',
    entityType: 'User',
    entityId: employee._id,
    metadata: { oldEmail, newEmail: employee.email }
  });

  const saved = await User.findById(employee._id)
    .select('-passwordHash -refreshToken -resetTokenHash -resetTokenExpiresAt')
    .populate('manager', 'name email designation');

  return res.json({ message: 'Email updated successfully', employee: mapEmployee(saved) });
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

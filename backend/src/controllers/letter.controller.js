import { LetterTemplate } from '../models/LetterTemplate.js';
import { EmployeeDocument } from '../models/EmployeeDocument.js';
import { User } from '../models/User.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';
import { saveDocument } from '../services/storage.service.js';
import { renderTemplate, buildLetterHtml, htmlToPdf, buildLetterReference } from '../services/letter.service.js';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function mapTemplate(item) {
  return {
    id: item._id,
    key: item.key,
    name: item.name,
    body: item.body,
    customFields: item.customFields,
    isActive: item.isActive,
    updatedAt: item.updatedAt
  };
}

export const listLetterTemplates = asyncHandler(async (req, res) => {
  const items = await LetterTemplate.find({}).sort({ name: 1 });
  res.json({ items: items.map(mapTemplate) });
});

export const upsertLetterTemplate = asyncHandler(async (req, res) => {
  const { key, name, body, customFields, isActive } = req.body;
  if (!key || !name || !body) {
    return res.status(400).json({ message: 'key, name and body are required' });
  }

  const template = await LetterTemplate.findOneAndUpdate(
    { key: key.toLowerCase() },
    {
      key: key.toLowerCase(),
      name,
      body,
      customFields: Array.isArray(customFields) ? customFields : [],
      isActive: isActive !== false,
      updatedBy: req.user._id
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await writeAuditLog({
    actor: req.user._id,
    action: 'letter.template.saved',
    entityType: 'LetterTemplate',
    entityId: template._id,
    metadata: { key: template.key }
  });

  res.json({ message: 'Template saved', template: mapTemplate(template) });
});

// Generates a letter PDF from a template + employee data, stores it as an
// EmployeeDocument under the 'employment' category, and notifies the employee.
export const generateLetter = asyncHandler(async (req, res) => {
  const { templateKey, customValues = {} } = req.body;
  const template = await LetterTemplate.findOne({ key: (templateKey || '').toLowerCase(), isActive: true });
  if (!template) {
    return res.status(404).json({ message: 'Active template not found' });
  }

  const employee = await User.findById(req.params.id).populate('manager', 'name designation');
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const company = (await CompanySettings.findOne({})) || {};
  const today = new Date();

  const context = {
    employee: {
      name: employee.name,
      email: employee.email,
      employeeCode: employee.employeeCode,
      department: employee.department,
      designation: employee.designation,
      joiningDate: formatDate(employee.joiningDate),
      manager: employee.manager?.name || ''
    },
    company: {
      name: company.companyName || '',
      address: company.address || ''
    },
    custom: customValues,
    today: formatDate(today)
  };

  const bodyHtml = renderTemplate(template.body, context);

  // Reference number = template prefix + an incrementing per-template sequence.
  const sequence = (await EmployeeDocument.countDocuments({ category: 'employment', subType: template.key, generatedLetter: true })) + 1;
  const referenceNo = buildLetterReference(template.key, sequence);

  const fullHtml = buildLetterHtml({ bodyHtml, company, referenceNo, dateText: formatDate(today) });
  const { buffer, mimeType, extension } = await htmlToPdf(fullHtml);

  const originalName = `${template.key}-${employee.employeeCode || employee._id}.${extension}`;
  const stored = await saveDocument({
    buffer,
    employeeId: employee._id.toString(),
    originalName,
    mimeType,
    timestamp: Date.now()
  });

  const document = await EmployeeDocument.create({
    user: employee._id,
    category: 'employment',
    subType: template.key,
    originalName,
    storedName: stored.storedName,
    mimeType,
    size: buffer.length,
    relativePath: stored.relativePath,
    storageProvider: stored.storageProvider,
    status: 'verified',
    verifiedBy: req.user._id,
    verifiedAt: today,
    remarks: `Auto-generated · Ref ${referenceNo}`,
    generatedLetter: true,
    isCurrent: true,
    uploadedBy: req.user._id
  });

  await writeAuditLog({
    actor: req.user._id,
    action: 'letter.generated',
    entityType: 'EmployeeDocument',
    entityId: document._id,
    metadata: { templateKey: template.key, referenceNo, userId: employee._id.toString() }
  });

  await createNotification({
    recipient: employee._id,
    type: 'letter.generated',
    title: `${template.name} issued`,
    message: `Your ${template.name} (Ref ${referenceNo}) is now available in your profile.`,
    link: '/profile',
    relatedEntityType: 'EmployeeDocument',
    relatedEntityId: document._id
  });

  res.status(201).json({
    message: 'Letter generated',
    referenceNo,
    format: extension,
    documentId: document._id,
    fallbackHtml: mimeType === 'text/html'
  });
});

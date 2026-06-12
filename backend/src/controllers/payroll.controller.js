import { validationResult } from 'express-validator';
import { AdvanceRequest } from '../models/AdvanceRequest.js';
import { PayrollRecord } from '../models/PayrollRecord.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

function monthRange(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 1);
  return { start, end };
}

function mapStructure(item) {
  return {
    id: item._id,
    basic: item.basic,
    hra: item.hra,
    allowances: item.allowances,
    statutoryDeductions: item.statutoryDeductions,
    otherDeductions: item.otherDeductions,
    user: item.user
      ? {
          id: item.user._id,
          name: item.user.name,
          email: item.user.email,
          department: item.user.department
        }
      : null
  };
}

function mapPayroll(item) {
  return {
    id: item._id,
    month: item.month,
    grossPay: item.grossPay,
    statutoryDeductions: item.statutoryDeductions,
    otherDeductions: item.otherDeductions,
    advanceDeduction: item.advanceDeduction,
    totalDeductions: item.totalDeductions,
    netPay: item.netPay,
    status: item.status,
    paidAt: item.paidAt,
    user: item.user
      ? {
          id: item.user._id,
          name: item.user.name,
          email: item.user.email,
          department: item.user.department
        }
      : null,
    generatedBy: item.generatedBy
      ? {
          id: item.generatedBy._id,
          name: item.generatedBy.name,
          email: item.generatedBy.email
        }
      : null
  };
}

export const upsertSalaryStructure = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { userId, basic, hra, allowances, statutoryDeductions, otherDeductions } = req.body;
  const item = await SalaryStructure.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        basic,
        hra,
        allowances,
        statutoryDeductions,
        otherDeductions
      }
    },
    { new: true, upsert: true }
  ).populate('user', 'name email department');

  await writeAuditLog({
    actor: req.user._id,
    action: 'payroll.structure.upserted',
    entityType: 'SalaryStructure',
    entityId: item._id,
    metadata: { userId }
  });

  res.json({ message: 'Salary structure saved', structure: mapStructure(item) });
});

export const listSalaryStructures = asyncHandler(async (req, res) => {
  const items = await SalaryStructure.find()
    .sort({ updatedAt: -1 })
    .populate('user', 'name email department');

  res.json({ items: items.map(mapStructure) });
});

export const runPayroll = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const month = req.body.month;
  const { start, end } = monthRange(month);
  const structureQuery = req.body.userId ? { user: req.body.userId } : {};
  const structures = await SalaryStructure.find(structureQuery).populate('user', 'name email department isActive');

  if (!structures.length) {
    return res.status(400).json({ message: 'No salary structures available for payroll run' });
  }

  const results = [];

  for (const structure of structures) {
    if (!structure.user?.isActive) continue;

    const advanceDeduction = await AdvanceRequest.find({
      requestedBy: structure.user._id,
      status: 'paid',
      paidAt: { $gte: start, $lt: end }
    }).then((items) => items.reduce((sum, item) => sum + item.amount, 0));

    const grossPay = structure.basic + structure.hra + structure.allowances;
    const totalDeductions = structure.statutoryDeductions + structure.otherDeductions + advanceDeduction;
    const netPay = Math.max(grossPay - totalDeductions, 0);

    const payroll = await PayrollRecord.findOneAndUpdate(
      { user: structure.user._id, month },
      {
        $set: {
          user: structure.user._id,
          month,
          grossPay,
          statutoryDeductions: structure.statutoryDeductions,
          otherDeductions: structure.otherDeductions,
          advanceDeduction,
          totalDeductions,
          netPay,
          generatedBy: req.user._id
        }
      },
      { new: true, upsert: true }
    )
      .populate('user', 'name email department')
      .populate('generatedBy', 'name email');

    await writeAuditLog({
      actor: req.user._id,
      action: 'payroll.run.generated',
      entityType: 'PayrollRecord',
      entityId: payroll._id,
      metadata: { month, netPay }
    });

    results.push(mapPayroll(payroll));
  }

  res.json({ message: 'Payroll run completed', items: results });
});

export const listPayrolls = asyncHandler(async (req, res) => {
  const query = ['admin', 'hr', 'manager'].includes(req.user.role) ? {} : { user: req.user._id };
  if (req.query.month) query.month = req.query.month;
  if (req.query.user && ['admin', 'hr', 'manager'].includes(req.user.role)) query.user = req.query.user;

  const items = await PayrollRecord.find(query)
    .sort({ month: -1, createdAt: -1 })
    .populate('user', 'name email department')
    .populate('generatedBy', 'name email');

  res.json({ items: items.map(mapPayroll) });
});

export const markPayrollPaid = asyncHandler(async (req, res) => {
  const item = await PayrollRecord.findById(req.params.id).populate('user', 'name email department');
  if (!item) {
    return res.status(404).json({ message: 'Payroll record not found' });
  }

  item.status = 'paid';
  item.paidAt = new Date();
  await item.save();

  await writeAuditLog({
    actor: req.user._id,
    action: 'payroll.marked_paid',
    entityType: 'PayrollRecord',
    entityId: item._id,
    metadata: { month: item.month }
  });

  await createNotification({
    recipient: item.user._id,
    type: 'payroll_paid',
    title: 'Payslip available',
    message: `Your payroll for ${item.month} has been marked as paid.`,
    link: '/payroll',
    relatedEntityType: 'PayrollRecord',
    relatedEntityId: item._id
  });

  const saved = await PayrollRecord.findById(item._id)
    .populate('user', 'name email department')
    .populate('generatedBy', 'name email');

  res.json({ message: 'Payroll marked as paid', payroll: mapPayroll(saved) });
});

export const getPayrollSummary = asyncHandler(async (req, res) => {
  const query = ['admin', 'hr', 'manager'].includes(req.user.role) ? {} : { user: req.user._id };
  const items = await PayrollRecord.find(query);

  res.json({
    totalPayrolls: items.length,
    paidCount: items.filter((item) => item.status === 'paid').length,
    draftCount: items.filter((item) => item.status === 'draft').length,
    totalNetPay: items.reduce((sum, item) => sum + item.netPay, 0)
  });
});

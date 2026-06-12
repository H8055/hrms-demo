import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPayrollSummary,
  listPayrolls,
  listSalaryStructures,
  markPayrollPaid,
  runPayroll,
  upsertSalaryStructure
} from '../controllers/payroll.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/summary', checkPermission('payroll', 'view'), getPayrollSummary);
router.get('/', checkPermission('payroll', 'view'), listPayrolls);
router.get('/structures', checkPermission('payroll', 'view'), listSalaryStructures);
router.post(
  '/structures',
  checkPermission('payroll', 'edit'),
  [body('userId').notEmpty().withMessage('userId is required')],
  upsertSalaryStructure
);
router.post('/run', checkPermission('payroll', 'create'), [body('month').notEmpty().withMessage('month is required')], runPayroll);
router.put('/:id/pay', checkPermission('payroll', 'approve'), markPayrollPaid);

export default router;

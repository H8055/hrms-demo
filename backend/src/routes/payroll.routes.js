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
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/summary', getPayrollSummary);
router.get('/', listPayrolls);
router.get('/structures', authorize('admin', 'hr'), listSalaryStructures);
router.post(
  '/structures',
  authorize('admin', 'hr'),
  [body('userId').notEmpty().withMessage('userId is required')],
  upsertSalaryStructure
);
router.post('/run', authorize('admin', 'hr'), [body('month').notEmpty().withMessage('month is required')], runPayroll);
router.put('/:id/pay', authorize('admin', 'hr'), markPayrollPaid);

export default router;

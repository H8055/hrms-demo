import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  approveAdvance,
  createAdvance,
  getAdvanceById,
  getAdvanceSummary,
  getMyAdvances,
  listAdvances,
  payAdvance,
  rejectAdvance
} from '../controllers/advance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
    body('reason').trim().notEmpty().withMessage('reason is required'),
    body('repaymentPlan').trim().notEmpty().withMessage('repaymentPlan is required'),
    body('notes').optional().isString()
  ],
  createAdvance
);

router.get('/mine', getMyAdvances);
router.get('/summary', getAdvanceSummary);
router.get(
  '/',
  authorize('admin', 'hr', 'manager'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('q').optional().isString()
  ],
  listAdvances
);
router.get('/:id', getAdvanceById);
router.put('/:id/approve', authorize('admin', 'hr', 'manager'), approveAdvance);
router.put('/:id/reject', authorize('admin', 'hr', 'manager'), rejectAdvance);
router.put(
  '/:id/pay',
  authorize('admin', 'hr', 'manager'),
  [
    body('paymentDate').notEmpty().withMessage('paymentDate is required'),
    body('paymentMode').isIn(['cash', 'bank', 'upi']).withMessage('paymentMode must be cash, bank or upi'),
    body('reference').optional().isString()
  ],
  payAdvance
);

export default router;

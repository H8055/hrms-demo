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
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  checkPermission('advance', 'create'),
  [
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
    body('reason').trim().notEmpty().withMessage('reason is required'),
    body('repaymentPlan').trim().notEmpty().withMessage('repaymentPlan is required'),
    body('notes').optional().isString()
  ],
  createAdvance
);

router.get('/mine', checkPermission('advance', 'view'), getMyAdvances);
router.get('/summary', checkPermission('advance', 'view'), getAdvanceSummary);
router.get(
  '/',
  checkPermission('advance', 'view'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('q').optional().isString()
  ],
  listAdvances
);
router.get('/:id', checkPermission('advance', 'view'), getAdvanceById);
router.put('/:id/approve', checkPermission('advance', 'approve'), approveAdvance);
router.put('/:id/reject', checkPermission('advance', 'approve'), rejectAdvance);
router.put(
  '/:id/pay',
  checkPermission('advance', 'pay'),
  [
    body('paymentDate').notEmpty().withMessage('paymentDate is required'),
    body('paymentMode').trim().notEmpty().withMessage('paymentMode is required'),
    body('reference').optional().isString()
  ],
  payAdvance
);

export default router;

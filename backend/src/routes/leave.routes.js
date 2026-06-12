import { Router } from 'express';
import { body } from 'express-validator';
import {
  createLeave,
  decideLeave,
  getLeaveSummary,
  listLeaves,
  listMyLeaves
} from '../controllers/leave.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/mine', listMyLeaves);
router.get('/summary', getLeaveSummary);
router.post(
  '/',
  [
    body('leaveType').isIn(['annual', 'sick', 'casual', 'unpaid']).withMessage('invalid leaveType'),
    body('fromDate').notEmpty().withMessage('fromDate is required'),
    body('toDate').notEmpty().withMessage('toDate is required'),
    body('reason').trim().notEmpty().withMessage('reason is required')
  ],
  createLeave
);
router.get('/', authorize('admin', 'hr', 'manager'), listLeaves);
router.put('/:id/decision', authorize('admin', 'hr', 'manager'), decideLeave);

export default router;

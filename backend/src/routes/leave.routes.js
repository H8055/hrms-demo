import { Router } from 'express';
import { body } from 'express-validator';
import {
  createLeave,
  decideLeave,
  getLeaveSummary,
  listLeaves,
  listMyLeaves
} from '../controllers/leave.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/mine', checkPermission('leave', 'view'), listMyLeaves);
router.get('/summary', checkPermission('leave', 'view'), getLeaveSummary);
router.post(
  '/',
  checkPermission('leave', 'create'),
  [
    body('leaveType').isIn(['annual', 'sick', 'casual', 'unpaid']).withMessage('invalid leaveType'),
    body('fromDate').notEmpty().withMessage('fromDate is required'),
    body('toDate').notEmpty().withMessage('toDate is required'),
    body('reason').trim().notEmpty().withMessage('reason is required')
  ],
  createLeave
);
router.get('/', checkPermission('leave', 'view'), listLeaves);
router.put('/:id/decision', checkPermission('leave', 'approve'), decideLeave);

export default router;

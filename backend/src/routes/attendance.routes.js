import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkIn,
  checkOut,
  decideRegularization,
  getAttendanceSummary,
  listAttendance,
  listMyAttendance,
  regularizeAttendance
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/mine', listMyAttendance);
router.get('/summary', getAttendanceSummary);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post(
  '/regularize',
  [body('date').notEmpty().withMessage('date is required'), body('reason').trim().notEmpty().withMessage('reason is required')],
  regularizeAttendance
);
router.get('/', authorize('admin', 'hr', 'manager'), listAttendance);
router.put('/:id/regularization-decision', authorize('admin', 'hr', 'manager'), decideRegularization);

export default router;

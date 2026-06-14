import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkIn,
  checkOut,
  decideRegularization,
  exportAttendanceCsv,
  getAttendanceSummary,
  listAttendance,
  listMyAttendance,
  regularizeAttendance
} from '../controllers/attendance.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/mine', checkPermission('attendance', 'view'), listMyAttendance);
router.get('/summary', checkPermission('attendance', 'view'), getAttendanceSummary);
router.get('/export/csv', checkPermission('attendance', 'export'), exportAttendanceCsv);
router.post('/check-in', checkPermission('attendance', 'create'), checkIn);
router.post('/check-out', checkPermission('attendance', 'create'), checkOut);
router.post(
  '/regularize',
  checkPermission('attendance', 'create'),
  [body('date').notEmpty().withMessage('date is required'), body('reason').trim().notEmpty().withMessage('reason is required')],
  regularizeAttendance
);
router.get('/', checkPermission('attendance', 'view'), listAttendance);
router.put('/:id/regularization-decision', checkPermission('attendance', 'approve'), decideRegularization);

export default router;

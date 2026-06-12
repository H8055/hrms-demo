import { Router } from 'express';
import advanceRoutes from './advance.routes.js';
import attendanceRoutes from './attendance.routes.js';
import auditRoutes from './audit.routes.js';
import authRoutes from './auth.routes.js';
import employeeRoutes from './employee.routes.js';
import healthRoutes from './health.routes.js';
import leaveRoutes from './leave.routes.js';
import notificationRoutes from './notification.routes.js';
import payrollRoutes from './payroll.routes.js';
import performanceRoutes from './performance.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/advances', advanceRoutes);
router.use('/payroll', payrollRoutes);
router.use('/performance', performanceRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);

export default router;

import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', checkPermission('permissions', 'view'), listAuditLogs);

export default router;

import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'hr'), listAuditLogs);

export default router;

import { Router } from 'express';
import { getOverviewReport } from '../controllers/reports.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/overview', checkPermission('reports', 'view'), getOverviewReport);

export default router;

import { Router } from 'express';
import { getOverviewReport } from '../controllers/reports.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/overview', authorize('admin', 'hr', 'manager'), getOverviewReport);

export default router;

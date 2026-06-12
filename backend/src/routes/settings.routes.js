import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin', 'hr'), getSettings);
router.put('/', authorize('admin', 'hr'), updateSettings);

export default router;

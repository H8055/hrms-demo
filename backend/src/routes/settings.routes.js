import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', checkPermission('settings', 'view'), getSettings);
router.put('/', checkPermission('settings', 'edit'), updateSettings);

export default router;

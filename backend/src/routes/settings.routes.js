import { Router } from 'express';
import { body, query } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import {
  createMasterDataItem,
  createRole,
  getFormOptions,
  getSettingsBundle,
  listMasterData,
  listRoles,
  updateMasterDataItem,
  updateRole
} from '../controllers/settings-master.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/form-options', getFormOptions);
router.get('/bundle', checkPermission('settings', 'view'), getSettingsBundle);
router.get('/roles', checkPermission('settings', 'view'), listRoles);
router.post(
  '/roles',
  checkPermission('settings', 'edit'),
  [body('label').trim().notEmpty().withMessage('label is required')],
  createRole
);
router.put('/roles/:id', checkPermission('settings', 'edit'), updateRole);
router.get('/masters', checkPermission('settings', 'view'), [query('category').optional().isString()], listMasterData);
router.post(
  '/masters',
  checkPermission('settings', 'edit'),
  [body('category').trim().notEmpty().withMessage('category is required'), body('label').trim().notEmpty().withMessage('label is required')],
  createMasterDataItem
);
router.put('/masters/:id', checkPermission('settings', 'edit'), updateMasterDataItem);
router.get('/', checkPermission('settings', 'view'), getSettings);
router.put('/', checkPermission('settings', 'edit'), updateSettings);

export default router;

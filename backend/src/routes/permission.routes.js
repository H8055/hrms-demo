import { Router } from 'express';
import { body } from 'express-validator';
import {
  bulkUpdateRolePermissions,
  getAllPermissions,
  getMyPermissions,
  getPermissionAuditLogs,
  getPermissionsMeta,
  getRolePermissions,
  replaceRoleModulePermissions,
  toggleRoleModuleAction,
  updateRoleModuleSidebar
} from '../controllers/permission.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/my', getMyPermissions);
router.get('/meta', checkPermission('permissions', 'view'), getPermissionsMeta);
router.get('/audit-logs', checkPermission('permissions', 'view'), getPermissionAuditLogs);
router.get('/roles', checkPermission('permissions', 'view'), getAllPermissions);
router.get('/roles/:role', checkPermission('permissions', 'view'), getRolePermissions);
router.put(
  '/roles/:role/modules/:module',
  checkPermission('permissions', 'edit'),
  [
    body('enabled').isBoolean().withMessage('enabled must be boolean'),
    body('showInSidebar').isBoolean().withMessage('showInSidebar must be boolean'),
    body('actions').isArray().withMessage('actions must be an array')
  ],
  replaceRoleModulePermissions
);
router.patch(
  '/roles/:role/modules/:module/actions/:action',
  checkPermission('permissions', 'edit'),
  [body('enabled').isBoolean().withMessage('enabled must be boolean')],
  toggleRoleModuleAction
);
router.patch(
  '/roles/:role/modules/:module/sidebar',
  checkPermission('permissions', 'edit'),
  [body('showInSidebar').isBoolean().withMessage('showInSidebar must be boolean')],
  updateRoleModuleSidebar
);
router.put(
  '/bulk-update',
  checkPermission('permissions', 'edit'),
  [body('role').notEmpty().withMessage('role is required'), body('permissions').isObject().withMessage('permissions object is required')],
  bulkUpdateRolePermissions
);

export default router;

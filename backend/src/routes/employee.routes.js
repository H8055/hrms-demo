import { Router } from 'express';
import multer from 'multer';
import { body, query } from 'express-validator';
import {
  changeEmployeeEmail,
  createEmployee,
  deactivateEmployee,
  deleteEmployeeDocument,
  downloadEmployeeDocument,
  exportEmployeesCsv,
  getEmployeeById,
  getEmployeeCompletion,
  getMyEmployeeProfile,
  updateMyPhoto,
  getOrgChart,
  importEmployeesCsv,
  listAllDocuments,
  listEmployeeDocuments,
  listEmployees,
  updateEmployee,
  uploadEmployeeDocument,
  verifyEmployeeDocument
} from '../controllers/employee.controller.js';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Rewrites :id to the authenticated user so self-service routes reuse the
// id-based document/completion handlers while staying scoped to the owner.
function asSelf(req, _res, next) {
  req.params.id = req.user._id.toString();
  next();
}

router.use(authenticate);

router.get('/me', getMyEmployeeProfile); // own profile — no module permission needed, just auth
router.post('/me/photo', upload.single('file'), updateMyPhoto);

// Self-service (own profile only) — controller enforces ownership.
router.get('/me/completion', asSelf, getEmployeeCompletion);
router.get('/me/documents', asSelf, listEmployeeDocuments);
router.post('/me/documents', asSelf, upload.single('file'), uploadEmployeeDocument);
router.get('/me/documents/:documentId/download', asSelf, downloadEmployeeDocument);
router.delete('/me/documents/:documentId', asSelf, deleteEmployeeDocument);

// Roles with change-requests view permission: all documents for the verification queue.
router.get('/documents/all', checkPermission('change-requests', 'view'), listAllDocuments);

router.get('/org-chart', checkPermission('employee', 'view'), getOrgChart);
router.get('/export/csv', checkPermission('employee', 'export'), exportEmployeesCsv);
router.post('/import-csv', checkPermission('employee', 'create'), [body('csvText').isString().withMessage('csvText is required')], importEmployeesCsv);
router.get(
  '/',
  checkPermission('employee', 'view'),
  [query('q').optional().isString(), query('role').optional().isString(), query('status').optional().isString()],
  listEmployees
);
router.get('/:id', checkPermission('employee', 'view'), getEmployeeById);
router.get('/:id/completion', checkPermission('employee', 'view'), getEmployeeCompletion);

// Document routes use auth-only and defer to in-controller category ACL so roles
// like "accounts" (salary docs only) work without the employee module permission.
router.get('/:id/documents', listEmployeeDocuments);
router.get('/:id/documents/:documentId/download', downloadEmployeeDocument);
router.post('/:id/documents', checkPermission('employee', 'edit'), upload.single('file'), uploadEmployeeDocument);
router.put('/:id/documents/:documentId/verify', checkPermission('employee', 'edit'), verifyEmployeeDocument);
router.delete('/:id/documents/:documentId', checkPermission('employee', 'delete'), deleteEmployeeDocument);

router.post(
  '/',
  checkPermission('employee', 'create'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').optional().isLength({ min: 8 }),
    body('role').optional().isString()
  ],
  createEmployee
);
router.put('/:id', checkPermission('employee', 'edit'), updateEmployee);
router.put('/:id/email', authorize('admin'), changeEmployeeEmail);
router.put('/:id/deactivate', checkPermission('employee', 'delete'), deactivateEmployee);

export default router;

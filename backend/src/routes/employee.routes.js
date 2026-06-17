import { Router } from 'express';
import multer from 'multer';
import { body, query } from 'express-validator';
import {
  createEmployee,
  deactivateEmployee,
  deleteEmployeeDocument,
  exportEmployeesCsv,
  getEmployeeById,
  getEmployeeStats,
  getMyEmployeeProfile,
  getOrgChart,
  importEmployeesCsv,
  listEmployeeDocuments,
  listEmployees,
  updateEmployee,
  uploadEmployeeDocument
} from '../controllers/employee.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);
router.get('/me', checkPermission('employee', 'view'), getMyEmployeeProfile);
router.get('/stats', checkPermission('dashboard', 'view'), getEmployeeStats);
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
router.get('/:id/documents', checkPermission('employee', 'view'), listEmployeeDocuments);
router.post('/:id/documents', checkPermission('employee', 'edit'), upload.single('file'), uploadEmployeeDocument);
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
router.put('/:id/deactivate', checkPermission('employee', 'delete'), deactivateEmployee);

export default router;

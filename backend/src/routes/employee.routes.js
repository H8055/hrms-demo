import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createEmployee,
  deactivateEmployee,
  getEmployeeById,
  getMyEmployeeProfile,
  getOrgChart,
  listEmployees,
  updateEmployee
} from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/me', getMyEmployeeProfile);
router.get('/org-chart', authorize('admin', 'hr', 'manager'), getOrgChart);
router.get(
  '/',
  authorize('admin', 'hr', 'manager'),
  [query('q').optional().isString(), query('role').optional().isString(), query('status').optional().isString()],
  listEmployees
);
router.get('/:id', authorize('admin', 'hr', 'manager'), getEmployeeById);
router.post(
  '/',
  authorize('admin', 'hr'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').optional().isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'hr', 'manager', 'employee'])
  ],
  createEmployee
);
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.put('/:id/deactivate', authorize('admin', 'hr'), deactivateEmployee);

export default router;

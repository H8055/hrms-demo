import { Router } from 'express';
import { body } from 'express-validator';
import {
  bootstrapStatus,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  authenticateOptional,
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'hr', 'manager', 'employee'])
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('valid email is required'),
    body('password').notEmpty().withMessage('password is required')
  ],
  login
);

router.get('/bootstrap-status', bootstrapStatus);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('token is required'),
    body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters')
  ],
  resetPassword
);

function authenticateOptional(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
}

export default router;

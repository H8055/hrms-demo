import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { body } from 'express-validator';
import { env } from '../config/env.js';
import {
  bootstrapStatus,
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again later.'
  }
});

const recoveryLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: Math.max(20, Math.floor(env.authRateLimitMax / 2)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password recovery attempts. Please try again later.'
  }
});

router.post(
  '/register',
  authenticateOptional,
  loginLimiter,
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
    body('role').optional().isString()
  ],
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('valid email is required'),
    body('password').notEmpty().withMessage('password is required')
  ],
  login
);

router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  changePassword
);
router.get('/bootstrap-status', bootstrapStatus);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', recoveryLimiter, [body('email').isEmail()], forgotPassword);
router.post(
  '/reset-password',
  recoveryLimiter,
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

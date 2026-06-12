import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, getPerformanceSummary, listReviews } from '../controllers/performance.controller.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/summary', checkPermission('performance', 'view'), getPerformanceSummary);
router.get('/', checkPermission('performance', 'view'), listReviews);
router.post(
  '/',
  checkPermission('performance', 'create'),
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('cycle').trim().notEmpty().withMessage('cycle is required'),
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('rating must be 1-5')
  ],
  createReview
);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, getPerformanceSummary, listReviews } from '../controllers/performance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/summary', getPerformanceSummary);
router.get('/', listReviews);
router.post(
  '/',
  authorize('admin', 'hr', 'manager'),
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('cycle').trim().notEmpty().withMessage('cycle is required'),
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('rating must be 1-5')
  ],
  createReview
);

export default router;

import { Router } from 'express';
import {
  listChangeRequests,
  reviewChangeRequest,
  submitChangeRequest
} from '../controllers/changeRequest.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Any authenticated employee can submit / view their own change requests.
router.post('/change-requests', submitChangeRequest);
router.get('/change-requests', listChangeRequests);

// Only HR / admin can approve or reject.
router.put('/change-requests/:id/review', authorize('hr', 'admin'), reviewChangeRequest);

export default router;

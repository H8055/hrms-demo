import { Router } from 'express';
import {
  listChangeRequests,
  reviewChangeRequest,
  submitChangeRequest
} from '../controllers/changeRequest.controller.js';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Any authenticated employee can submit / view their own change requests.
router.post('/change-requests', submitChangeRequest);
router.get('/change-requests', listChangeRequests);

// Only roles with change-requests edit permission can approve or reject.
router.put('/change-requests/:id/review', checkPermission('change-requests', 'edit'), reviewChangeRequest);

export default router;

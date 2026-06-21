import { Router } from 'express';
import {
  generateLetter,
  listLetterTemplates,
  upsertLetterTemplate
} from '../controllers/letter.controller.js';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/templates', authorize('hr', 'admin'), listLetterTemplates);
router.put('/templates', authorize('hr', 'admin'), upsertLetterTemplate);

// Generate a letter for a given employee (HR/admin via employee.edit permission).
router.post('/employees/:id/generate', checkPermission('employee', 'edit'), generateLetter);

export default router;

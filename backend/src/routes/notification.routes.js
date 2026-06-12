import { Router } from 'express';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;

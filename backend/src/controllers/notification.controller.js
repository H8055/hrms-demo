import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function mapNotification(doc) {
  return {
    id: doc._id,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    link: doc.link,
    relatedEntityType: doc.relatedEntityType,
    relatedEntityId: doc.relatedEntityId,
    metadata: doc.metadata || {},
    isRead: doc.isRead,
    readAt: doc.readAt,
    createdAt: doc.createdAt
  };
}

export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 50);

  const [items, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);

  res.json({ items: items.map(mapNotification), unreadCount });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });

  if (!item) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  if (!item.isRead) {
    item.isRead = true;
    item.readAt = new Date();
    await item.save();
  }

  res.json({ message: 'Notification marked as read', notification: mapNotification(item) });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.json({ message: 'All notifications marked as read' });
});

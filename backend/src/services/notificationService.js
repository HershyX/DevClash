import Notification from '../models/Notification.js';
import { getNotifications } from './activityService.js';

export async function listNotifications(userId, { unreadOnly, limit = 20, page = 1 } = {}) {
  const items = await getNotifications(userId, { unreadOnly, limit, page });
  return items.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    metadata: n.metadata,
    createdAt: n.createdAt,
  }));
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}

export async function markRead(userId, notificationId) {
  const filter = notificationId
    ? { _id: notificationId, user: userId }
    : { user: userId, isRead: false };
  await Notification.updateMany(filter, { isRead: true });
}

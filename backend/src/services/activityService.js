import ActivityEvent from '../models/ActivityEvent.js';
import Notification from '../models/Notification.js';

export async function logActivity({ userId, userName, type, description, metadata = {} }) {
  try {
    await ActivityEvent.create({ user: userId, userName, type, description, metadata });
  } catch (err) {
    console.error('[activity] failed to log event:', err.message);
  }
}

export async function notify({ userId, type = 'system', title, message = '', metadata = {} }) {
  try {
    await Notification.create({ user: userId, type, title, message, metadata });
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message);
  }
}

export async function getRecentActivity({ userId = null, limit = 20 } = {}) {
  const query = userId ? { user: userId } : {};
  return ActivityEvent.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getNotifications(userId, { unreadOnly = false, limit = 20, page = 1 } = {}) {
  const query = { user: userId };
  if (unreadOnly) query.isRead = false;
  const skip = (page - 1) * limit;
  return Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

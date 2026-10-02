import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notificationService.js';

/** GET /api/notifications */
export const list = asyncHandler(async (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 20, 100);
  const page   = Math.max(Number(req.query.page)  || 1,  1);
  const data = await notificationService.listNotifications(req.user._id.toString(), {
    unreadOnly: req.query.unread === 'true',
    limit,
    page,
  });
  res.json({ success: true, data });
});

/** GET /api/notifications/unread-count */
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id.toString());
  res.json({ success: true, data: { count } });
});

/** POST /api/notifications/mark-read (optionally with { id }) */
export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user._id.toString(), req.body?.id);
  res.json({ success: true, message: 'Notifications marked as read' });
});

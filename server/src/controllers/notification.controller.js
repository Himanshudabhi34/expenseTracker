import * as notificationService from '../services/notification.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

const context = (req) => ({
  timeZone: req.user.timezone,
  currency: req.user.currency || 'INR',
});

export const list = asyncHandler(async (req, res) => {
  const result = await notificationService.list(req.user._id, req.query, context(req));
  sendSuccess(res, result);
});

export const unreadCount = asyncHandler(async (req, res) => {
  await notificationService.syncAll(req.user._id, context(req));
  const unreadCount = await notificationService.unreadCount(req.user._id);
  sendSuccess(res, { unreadCount });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id);
  sendSuccess(res, { notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user._id);
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await notificationService.remove(req.user._id, req.params.id);
  sendSuccess(res, result);
});

export const clearAll = asyncHandler(async (req, res) => {
  const result = await notificationService.clearAll(req.user._id);
  sendSuccess(res, result);
});

export default { list, unreadCount, markRead, markAllRead, remove, clearAll };

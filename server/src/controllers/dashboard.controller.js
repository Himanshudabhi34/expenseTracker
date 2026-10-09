import * as dashboardService from '../services/dashboard.service.js';
import * as notificationService from '../services/notification.service.js';
import * as suggestionService from '../services/suggestion.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary(req.user._id, req.user.timezone, {
    period: req.query.period || 'month',
  });
  // Refresh notifications (budget thresholds & last month's summary) but no
  // longer surface transient alert banners here.
  await notificationService.syncAll(req.user._id, {
    timeZone: req.user.timezone,
    currency: req.user.currency,
  });
  sendSuccess(res, data);
});

export const suggestions = asyncHandler(async (req, res) => {
  const data = await suggestionService.getSavingSuggestions(req.user._id, req.user.timezone);
  sendSuccess(res, data);
});

export default { summary, suggestions };

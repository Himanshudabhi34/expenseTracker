import * as budgetService from '../services/budget.service.js';
import * as notificationService from '../services/notification.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

async function refreshAlerts(req) {
  await notificationService.syncBudgetAlerts(req.user._id, { timeZone: req.user.timezone });
}

export const list = asyncHandler(async (req, res) => {
  const budgets = await budgetService.listBudgets(req.user._id, req.user.timezone);
  sendSuccess(res, { budgets });
});

export const history = asyncHandler(async (req, res) => {
  const months = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);
  const data = await budgetService.getBudgetHistory(req.user._id, req.user.timezone, months);
  sendSuccess(res, { history: data });
});

export const create = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user._id, req.body);
  await refreshAlerts(req);
  sendSuccess(res, { budget }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const budget = await budgetService.updateBudget(req.user._id, req.params.id, req.body);
  await refreshAlerts(req);
  sendSuccess(res, { budget });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await budgetService.deleteBudget(req.user._id, req.params.id);
  sendSuccess(res, result);
});

export default { list, history, create, update, remove };

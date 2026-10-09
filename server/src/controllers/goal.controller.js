import * as goalService from '../services/goal.service.js';
import * as notificationService from '../services/notification.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

async function notifyCompletion(req, goal) {
  await notificationService.notifyGoalCompleted(req.user._id, goal, {
    currency: req.user.currency,
  });
}

export const list = asyncHandler(async (req, res) => {
  const goals = await goalService.listGoals(req.user._id, { status: req.query.status });
  sendSuccess(res, { goals });
});

export const create = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user._id, req.body);
  await notifyCompletion(req, goal);
  sendSuccess(res, { goal }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.user._id, req.params.id, req.body);
  await notifyCompletion(req, goal);
  sendSuccess(res, { goal });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await goalService.deleteGoal(req.user._id, req.params.id);
  sendSuccess(res, result);
});

export default { list, create, update, remove };

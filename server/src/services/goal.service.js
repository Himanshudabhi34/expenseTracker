import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import ApiError from '../utils/ApiError.js';
import { toMinor, toMajor } from '../utils/currency.js';
import { GOAL_STATUS } from '../config/constants.js';

function serialize(goal) {
  const obj = goal.toObject ? goal.toObject({ virtuals: true }) : goal;
  const remaining = Math.max(0, obj.targetAmountMinor - obj.currentAmountMinor);
  return {
    id: obj._id,
    name: obj.name,
    targetAmountMinor: obj.targetAmountMinor,
    targetAmount: toMajor(obj.targetAmountMinor),
    currentAmountMinor: obj.currentAmountMinor,
    currentAmount: toMajor(obj.currentAmountMinor),
    remainingAmountMinor: remaining,
    remainingAmount: toMajor(remaining),
    progressPercent:
      obj.targetAmountMinor > 0
        ? Math.min(100, Math.round((obj.currentAmountMinor / obj.targetAmountMinor) * 10000) / 100)
        : 0,
    targetDate: obj.targetDate,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function listGoals(userId, { status } = {}) {
  const filter = { userId };
  if (status) filter.status = status;
  const goals = await Goal.find(filter).sort({ createdAt: -1 });
  return goals.map(serialize);
}

export async function createGoal(userId, payload) {
  const goal = await Goal.create({
    userId,
    name: payload.name,
    targetAmountMinor: toMinor(payload.targetAmount),
    currentAmountMinor: payload.currentAmount ? toMinor(payload.currentAmount) : 0,
    targetDate: payload.targetDate || null,
    status: payload.status || GOAL_STATUS.ACTIVE,
  });
  return serialize(goal);
}

export async function updateGoal(userId, id, payload) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid goal id');
  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) throw ApiError.notFound('Goal not found');

  if (payload.name !== undefined) goal.name = payload.name;
  if (payload.targetAmount !== undefined) goal.targetAmountMinor = toMinor(payload.targetAmount);
  if (payload.currentAmount !== undefined) goal.currentAmountMinor = toMinor(payload.currentAmount);
  if (payload.contribution !== undefined) {
    const next = goal.currentAmountMinor + toMinor(payload.contribution);
    goal.currentAmountMinor = Math.max(0, next);
  }
  if (payload.targetDate !== undefined) goal.targetDate = payload.targetDate || null;
  if (payload.status !== undefined) goal.status = payload.status;

  if (goal.currentAmountMinor >= goal.targetAmountMinor && goal.targetAmountMinor > 0) {
    goal.status = GOAL_STATUS.COMPLETED;
  }

  await goal.save();
  return serialize(goal);
}

export async function deleteGoal(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid goal id');
  const goal = await Goal.findOneAndDelete({ _id: id, userId });
  if (!goal) throw ApiError.notFound('Goal not found');
  return { id };
}

export default { listGoals, createGoal, updateGoal, deleteGoal, serialize };

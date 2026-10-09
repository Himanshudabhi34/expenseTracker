import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { toMinor, toMajor } from '../utils/currency.js';
import { getZonedParts, monthKey, startOfMonth, endOfMonth } from '../utils/dateRange.js';
import { TRANSACTION_TYPES } from '../config/constants.js';

async function expenseByCategory(userId, start, end) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: TRANSACTION_TYPES.EXPENSE,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amountMinor' } } },
  ]);
  const map = new Map();
  let totalAll = 0;
  for (const row of rows) {
    map.set(String(row._id), row.total);
    totalAll += row.total;
  }
  return { map, totalExpense: totalAll };
}

export function serializeBudget(budget, spentMinor, periodKeyValue) {
  const remaining = budget.amountMinor - spentMinor;
  const percent = budget.amountMinor > 0 ? (spentMinor / budget.amountMinor) * 100 : 0;
  return {
    id: budget._id,
    name: budget.name,
    period: budget.period,
    periodKey: periodKeyValue,
    amountMinor: budget.amountMinor,
    amount: toMajor(budget.amountMinor),
    category: budget.categoryId && budget.categoryId.name ? budget.categoryId : null,
    spentMinor,
    spent: toMajor(spentMinor),
    remainingMinor: remaining,
    remaining: toMajor(remaining),
    percent: Math.round(percent * 100) / 100,
    warningThresholds: budget.warningThresholds,
    isActive: budget.isActive,
  };
}

export async function getBudgetsWithUsage(userId, timeZone = 'UTC', now = new Date()) {
  const periodKeyValue = monthKey(now, timeZone);
  const start = startOfMonth(now, timeZone);
  const end = endOfMonth(now, timeZone);

  const budgets = await Budget.find({ userId, isActive: true })
    .populate('categoryId', 'name iconKey')
    .sort({ createdAt: 1 });
  const { map, totalExpense } = await expenseByCategory(userId, start, end);

  const summaries = budgets.map((budget) => {
    const spentMinor = budget.categoryId
      ? map.get(String(budget.categoryId._id)) || 0
      : totalExpense;
    return { budget, summary: serializeBudget(budget, spentMinor, periodKeyValue) };
  });

  return { summaries, periodKey: periodKeyValue };
}

/**
 * Returns every threshold a budget has currently crossed (no persistence).
 * Used by the notification pipeline so alerts are not blocked by historical
 * alertState; callers dedupe via a unique notification key instead.
 */
export async function collectBudgetThresholdAlerts(userId, timeZone = 'UTC', now = new Date()) {
  const { summaries, periodKey } = await getBudgetsWithUsage(userId, timeZone, now);
  const alerts = [];

  for (const { budget, summary } of summaries) {
    const crossed = (budget.warningThresholds || [])
      .slice()
      .sort((a, b) => a - b)
      .filter((t) => summary.percent >= t);

    for (const threshold of crossed) {
      alerts.push({
        budgetId: budget._id,
        name: budget.name,
        category: summary.category,
        threshold,
        percent: summary.percent,
        spent: summary.spent,
        amount: summary.amount,
        periodKey,
        level: threshold >= 100 ? 'exceeded' : 'warning',
        message:
          threshold >= 100
            ? `You have exceeded your "${budget.name}" budget (${summary.percent}% used).`
            : `You have used ${summary.percent}% of your "${budget.name}" budget.`,
      });
    }
  }

  return alerts;
}

/**
 * Computes current budget status and persists newly-crossed threshold alerts so
 * they are only returned once per budget period.
 */
export async function evaluateBudgetAlerts(userId, timeZone = 'UTC', now = new Date()) {
  const { summaries, periodKey } = await getBudgetsWithUsage(userId, timeZone, now);
  const alerts = [];

  for (const { budget, summary } of summaries) {
    const already = budget.alertState?.get(periodKey) || [];
    const crossed = (budget.warningThresholds || [])
      .slice()
      .sort((a, b) => a - b)
      .filter((t) => summary.percent >= t && !already.includes(t));

    if (crossed.length > 0) {
      budget.alertState.set(periodKey, [...already, ...crossed]);
      await budget.save();
      for (const threshold of crossed) {
        alerts.push({
          budgetId: budget._id,
          name: budget.name,
          category: summary.category,
          threshold,
          percent: summary.percent,
          spent: summary.spent,
          amount: summary.amount,
          level: threshold >= 100 ? 'exceeded' : 'warning',
          message:
            threshold >= 100
              ? `You have exceeded your "${budget.name}" budget (${summary.percent}% used).`
              : `You have used ${summary.percent}% of your "${budget.name}" budget.`,
        });
      }
    }
  }

  return { alerts, budgets: summaries.map((s) => s.summary) };
}

export async function listBudgets(userId, timeZone = 'UTC') {
  const { summaries } = await getBudgetsWithUsage(userId, timeZone);
  return summaries.map((s) => s.summary);
}

export async function createBudget(userId, payload) {
  const budget = await Budget.create({
    userId,
    name: payload.name || 'Monthly Budget',
    period: payload.period || 'monthly',
    amountMinor: toMinor(payload.amount),
    categoryId: payload.categoryId || null,
    warningThresholds: payload.warningThresholds || undefined,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  });
  await budget.populate('categoryId', 'name iconKey');
  return serializeBudget(budget, 0, monthKey(new Date(), 'UTC'));
}

export async function updateBudget(userId, id, payload) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid budget id');
  const update = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.period !== undefined) update.period = payload.period;
  if (payload.amount !== undefined) update.amountMinor = toMinor(payload.amount);
  if (payload.categoryId !== undefined) update.categoryId = payload.categoryId || null;
  if (payload.warningThresholds !== undefined) update.warningThresholds = payload.warningThresholds;
  if (payload.isActive !== undefined) update.isActive = payload.isActive;

  const budget = await Budget.findOneAndUpdate({ _id: id, userId }, update, {
    new: true,
    runValidators: true,
  }).populate('categoryId', 'name iconKey');
  if (!budget) throw ApiError.notFound('Budget not found');
  return serializeBudget(budget, 0, monthKey(new Date(), 'UTC'));
}

export async function deleteBudget(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid budget id');
  const budget = await Budget.findOneAndDelete({ _id: id, userId });
  if (!budget) throw ApiError.notFound('Budget not found');
  return { id };
}

/**
 * Historical budget performance: for each of the last N months, compute expense
 * against the current budget amounts.
 */
export async function getBudgetHistory(userId, timeZone = 'UTC', months = 6, now = new Date()) {
  const budgets = await Budget.find({ userId, isActive: true }).populate('categoryId', 'name');
  const monthlyBudget = budgets
    .filter((b) => !b.categoryId)
    .reduce((sum, b) => sum + b.amountMinor, 0);

  const result = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const ref = new Date(now.getTime());
    const parts = getZonedParts(ref, timeZone);
    const targetMonth = parts.month - 1 - i;
    const year = parts.year + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;
    const monthDate = new Date(Date.UTC(year, month, 15));
    const start = startOfMonth(monthDate, timeZone);
    const end = endOfMonth(monthDate, timeZone);
    const { totalExpense } = await expenseByCategory(userId, start, end);
    result.push({
      periodKey: monthKey(monthDate, timeZone),
      spent: toMajor(totalExpense),
      budget: toMajor(monthlyBudget),
    });
  }
  return result;
}

export default {
  getBudgetsWithUsage,
  collectBudgetThresholdAlerts,
  evaluateBudgetAlerts,
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetHistory,
  serializeBudget,
};

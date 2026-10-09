import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, buildPaginatedResult } from '../utils/pagination.js';
import { formatMinor, toMajor } from '../utils/currency.js';
import {
  addMonths,
  endOfMonth,
  monthKey,
  monthLabel,
  startOfMonth,
} from '../utils/dateRange.js';
import {
  TRANSACTION_TYPES,
  LARGE_TRANSACTION_MINOR,
  NOTIFICATION_TYPES,
  NOTIFICATION_LEVELS,
} from '../config/constants.js';
import { collectBudgetThresholdAlerts } from './budget.service.js';

/**
 * Idempotent create. When a dedupeKey is provided the notification is only
 * created once (per user), so the same event never produces duplicates.
 */
export async function create(userId, payload) {
  const base = {
    userId,
    type: payload.type,
    level: payload.level || NOTIFICATION_LEVELS.INFO,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
  };

  if (payload.dedupeKey) {
    return Notification.findOneAndUpdate(
      { userId, dedupeKey: payload.dedupeKey },
      { $setOnInsert: { ...base, dedupeKey: payload.dedupeKey } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  }

  const created = await Notification.create(base);
  return created.toObject();
}

export async function list(userId, query = {}, { timeZone = 'UTC', currency = 'INR' } = {}) {
  await syncAll(userId, { timeZone, currency });

  const { page, limit, skip } = getPagination(query);
  const filter = { userId };
  if (query.unread === true || query.unread === 'true') filter.read = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false }),
  ]);

  const { pagination } = buildPaginatedResult({ items, total, page, limit });
  return { notifications: items, pagination, unreadCount: unread };
}

export async function unreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}

export async function markRead(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid notification id');
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true, readAt: new Date() },
    { new: true }
  ).lean();
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
}

export async function markAllRead(userId) {
  const res = await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
  return { modified: res.modifiedCount ?? 0 };
}

export async function remove(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid notification id');
  const notification = await Notification.findOneAndDelete({ _id: id, userId });
  if (!notification) throw ApiError.notFound('Notification not found');
  return { id };
}

export async function clearAll(userId) {
  const res = await Notification.deleteMany({ userId });
  return { deleted: res.deletedCount ?? 0 };
}

/**
 * Turns newly-crossed budget thresholds into notifications.
 */
export async function syncBudgetAlerts(userId, { timeZone = 'UTC', now = new Date() } = {}) {
  const alerts = await collectBudgetThresholdAlerts(userId, timeZone, now);

  for (const alert of alerts) {
    const exceeded = alert.level === 'exceeded';
    await create(userId, {
      type: exceeded ? NOTIFICATION_TYPES.BUDGET_EXCEEDED : NOTIFICATION_TYPES.BUDGET_WARNING,
      level: exceeded ? NOTIFICATION_LEVELS.DANGER : NOTIFICATION_LEVELS.WARNING,
      title: exceeded ? 'Budget exceeded' : 'Budget warning',
      message: alert.message,
      data: {
        budgetId: String(alert.budgetId),
        threshold: alert.threshold,
        percent: alert.percent,
        spent: alert.spent,
        amount: alert.amount,
        periodKey: alert.periodKey,
      },
      dedupeKey: `budget:${alert.budgetId}:${alert.periodKey}:${alert.threshold}`,
    });
  }

  return alerts.length;
}

/**
 * Ensures a summary notification exists for the previous month (lazy — no
 * scheduler required). Does nothing when that month has no transactions.
 */
export async function syncMonthlySummary(
  userId,
  { timeZone = 'UTC', currency = 'INR', now = new Date() } = {}
) {
  const previous = addMonths(now, -1, timeZone);
  const key = monthKey(previous, timeZone);
  const dedupeKey = `summary:${key}`;

  const exists = await Notification.exists({ userId, dedupeKey });
  if (exists) return false;

  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        transactionDate: {
          $gte: startOfMonth(previous, timeZone),
          $lte: endOfMonth(previous, timeZone),
        },
      },
    },
    { $group: { _id: '$type', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);

  if (rows.length === 0) return false;

  let expenseMinor = 0;
  let incomeMinor = 0;
  let count = 0;
  for (const row of rows) {
    count += row.count;
    if (row._id === TRANSACTION_TYPES.INCOME) incomeMinor += row.total;
    else expenseMinor += row.total;
  }

  const label = monthLabel(previous, timeZone);
  await create(userId, {
    type: NOTIFICATION_TYPES.MONTHLY_SUMMARY,
    level: NOTIFICATION_LEVELS.INFO,
    title: `Monthly summary — ${label}`,
    message: `In ${label} you spent ${formatMinor(expenseMinor, currency)} and received ${formatMinor(
      incomeMinor,
      currency
    )} across ${count} transaction${count === 1 ? '' : 's'}.`,
    data: {
      monthKey: key,
      expense: toMajor(expenseMinor),
      income: toMajor(incomeMinor),
      count,
    },
    dedupeKey,
  });
  return true;
}

export async function syncAll(userId, ctx = {}) {
  await Promise.all([
    syncBudgetAlerts(userId, ctx).catch(() => 0),
    syncMonthlySummary(userId, ctx).catch(() => false),
  ]);
}

export async function notifyGoalCompleted(userId, goal, { currency = 'INR' } = {}) {
  if (!goal || goal.status !== 'completed') return false;
  const dedupeKey = `goal:${goal.id}:completed`;
  if (await Notification.exists({ userId, dedupeKey })) return false;

  await create(userId, {
    type: NOTIFICATION_TYPES.GOAL_COMPLETED,
    level: NOTIFICATION_LEVELS.SUCCESS,
    title: 'Saving goal reached',
    message: `Congratulations! You reached your "${goal.name}" goal of ${formatMinor(
      goal.targetAmountMinor,
      currency
    )}.`,
    data: { goalId: String(goal.id), targetAmountMinor: goal.targetAmountMinor },
    dedupeKey,
  });
  return true;
}

export async function notifyLargeTransaction(userId, transaction, { currency = 'INR' } = {}) {
  if (!transaction || transaction.type !== TRANSACTION_TYPES.EXPENSE) return false;
  if (!(transaction.amountMinor >= LARGE_TRANSACTION_MINOR)) return false;

  const dedupeKey = `tx:${transaction._id}:large`;
  if (await Notification.exists({ userId, dedupeKey })) return false;

  await create(userId, {
    type: NOTIFICATION_TYPES.LARGE_TRANSACTION,
    level: NOTIFICATION_LEVELS.INFO,
    title: 'Large expense recorded',
    message: `A large expense of ${formatMinor(
      transaction.amountMinor,
      transaction.currency || currency
    )} was recorded: "${transaction.description}".`,
    data: { transactionId: String(transaction._id), amountMinor: transaction.amountMinor },
    dedupeKey,
  });
  return true;
}

export default {
  create,
  list,
  unreadCount,
  markRead,
  markAllRead,
  remove,
  clearAll,
  syncBudgetAlerts,
  syncMonthlySummary,
  syncAll,
  notifyGoalCompleted,
  notifyLargeTransaction,
};

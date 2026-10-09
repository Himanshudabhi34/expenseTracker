import mongoose from 'mongoose';
import Transaction from '../../models/Transaction.js';
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  getZonedParts,
  monthLabel,
  startOfDay,
  startOfMonth,
  startOfWeek,
  zonedTimeToUtc,
} from '../../utils/dateRange.js';
import { toMajor } from '../../utils/currency.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import { listCategories } from '../../services/category.service.js';
import { getBudgetsWithUsage } from '../../services/budget.service.js';
import { listGoals } from '../../services/goal.service.js';

export function resolvePeriodRange(period, timeZone, now = new Date()) {
  switch (period) {
    case 'today':
      return { start: startOfDay(now, timeZone), end: endOfDay(now, timeZone), label: 'today' };
    case 'yesterday': {
      const y = addDays(now, -1, timeZone);
      return { start: startOfDay(y, timeZone), end: endOfDay(y, timeZone), label: 'yesterday' };
    }
    case 'week':
      return {
        start: startOfWeek(now, timeZone),
        end: endOfDay(now, timeZone),
        label: 'this week',
      };
    case 'last_month': {
      const prev = addMonths(now, -1, timeZone);
      return {
        start: startOfMonth(prev, timeZone),
        end: endOfMonth(prev, timeZone),
        label: monthLabel(prev, timeZone),
      };
    }
    case 'year': {
      const y = getZonedParts(now, timeZone).year;
      return {
        start: zonedTimeToUtc({ year: y, month: 1, day: 1 }, timeZone),
        end: endOfDay(now, timeZone),
        label: `${y}`,
      };
    }
    case 'month':
    default:
      return {
        start: startOfMonth(now, timeZone),
        end: endOfMonth(now, timeZone),
        label: monthLabel(now, timeZone),
      };
  }
}

async function sum(userId, type, start, end) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);
  return { totalMinor: rows[0]?.total || 0, count: rows[0]?.count || 0 };
}

async function resolveCategoryByName(userId, name) {
  if (!name) return null;
  const categories = await listCategories(userId);
  const lower = name.toLowerCase();
  return (
    categories.find((c) => c.name.toLowerCase() === lower) ||
    categories.find(
      (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
    ) ||
    null
  );
}

async function topCategories(userId, start, end, limit = 5) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: TRANSACTION_TYPES.EXPENSE,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amountMinor' } } },
    { $sort: { total: -1 } },
    { $limit: limit },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  ]);
  return rows.map((r) => ({
    name: r.category?.name || 'Uncategorized',
    total: toMajor(r.total),
    totalMinor: r.total,
  }));
}

export async function executeIntent(intent, entities, ctx) {
  const { userId, timeZone = 'UTC', now = new Date() } = ctx;
  const period = entities.period || 'month';
  const range = resolvePeriodRange(period, timeZone, now);
  const categoryName = entities.categoryQuery || null;

  switch (intent) {
    case 'help':
      return { intent: 'help' };

    case 'daily_expense': {
      const r = resolvePeriodRange(
        entities.period === 'yesterday' ? 'yesterday' : 'today',
        timeZone,
        now
      );
      const res = await sum(userId, TRANSACTION_TYPES.EXPENSE, r.start, r.end);
      return {
        intent,
        period: r.label,
        hasData: res.count > 0,
        total: toMajor(res.totalMinor),
        count: res.count,
      };
    }

    case 'period_expense':
    case 'monthly_expense': {
      const res = await sum(userId, TRANSACTION_TYPES.EXPENSE, range.start, range.end);
      return {
        intent,
        period: range.label,
        hasData: res.count > 0,
        total: toMajor(res.totalMinor),
        count: res.count,
      };
    }

    case 'income_total': {
      const res = await sum(userId, TRANSACTION_TYPES.INCOME, range.start, range.end);
      return {
        intent,
        period: range.label,
        hasData: res.count > 0,
        total: toMajor(res.totalMinor),
        count: res.count,
      };
    }

    case 'category_spending': {
      const category = await resolveCategoryByName(userId, categoryName);
      if (!category) {
        return { intent, resolved: false, categoryName, period: range.label };
      }
      const rows = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: TRANSACTION_TYPES.EXPENSE,
            categoryId: category._id,
            transactionDate: { $gte: range.start, $lte: range.end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
      ]);
      return {
        intent,
        resolved: true,
        category: category.name,
        period: range.label,
        total: toMajor(rows[0]?.total || 0),
        count: rows[0]?.count || 0,
      };
    }

    case 'top_categories': {
      const rows = await topCategories(userId, range.start, range.end);
      return { intent, period: range.label, categories: rows, hasData: rows.length > 0 };
    }

    case 'largest_transaction': {
      const tx = await Transaction.findOne({
        userId,
        type: TRANSACTION_TYPES.EXPENSE,
        transactionDate: { $gte: range.start, $lte: range.end },
      })
        .sort({ amountMinor: -1 })
        .populate('categoryId', 'name');
      if (!tx) return { intent, period: range.label, hasData: false };
      return {
        intent,
        period: range.label,
        hasData: true,
        transaction: {
          amount: toMajor(tx.amountMinor),
          description: tx.description,
          category: tx.categoryId?.name || 'Uncategorized',
          date: tx.transactionDate,
        },
      };
    }

    case 'month_comparison': {
      const currentRange = resolvePeriodRange('month', timeZone, now);
      const prevRange = resolvePeriodRange('last_month', timeZone, now);
      const [curExp, prevExp, curInc, prevInc] = await Promise.all([
        sum(userId, TRANSACTION_TYPES.EXPENSE, currentRange.start, currentRange.end),
        sum(userId, TRANSACTION_TYPES.EXPENSE, prevRange.start, prevRange.end),
        sum(userId, TRANSACTION_TYPES.INCOME, currentRange.start, currentRange.end),
        sum(userId, TRANSACTION_TYPES.INCOME, prevRange.start, prevRange.end),
      ]);
      const pct = (c, p) => (p > 0 ? Math.round(((c - p) / p) * 10000) / 100 : c > 0 ? 100 : 0);
      return {
        intent,
        currentLabel: currentRange.label,
        previousLabel: prevRange.label,
        current: { expense: toMajor(curExp.totalMinor), income: toMajor(curInc.totalMinor) },
        previous: { expense: toMajor(prevExp.totalMinor), income: toMajor(prevInc.totalMinor) },
        expenseChangePercent: pct(curExp.totalMinor, prevExp.totalMinor),
      };
    }

    case 'budget_status': {
      const { summaries } = await getBudgetsWithUsage(userId, timeZone, now);
      return {
        intent,
        period: range.label,
        hasBudgets: summaries.length > 0,
        budgets: summaries.map((s) => s.summary),
      };
    }

    case 'savings_goals': {
      const goals = await listGoals(userId);
      return { intent, hasGoals: goals.length > 0, goals };
    }

    default:
      return { intent: 'unknown' };
  }
}

export default { executeIntent, resolvePeriodRange };

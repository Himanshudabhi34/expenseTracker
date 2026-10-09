import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import {
  addDays,
  dayKey,
  endOfDay,
  endOfMonth,
  getZonedParts,
  monthKey,
  resolveRange,
  startOfDay,
  startOfMonth,
} from '../utils/dateRange.js';
import { toMajor } from '../utils/currency.js';
import { TRANSACTION_TYPES } from '../config/constants.js';

async function sumByType(userId, type, start, end) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' } } },
  ]);
  return rows[0]?.total || 0;
}

async function topCategory(userId, start, end) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: TRANSACTION_TYPES.EXPENSE,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  ]);
  const row = rows[0];
  if (!row) return null;
  return {
    categoryId: row._id,
    name: row.category?.name || 'Uncategorized',
    iconKey: row.category?.iconKey || 'tag',
    total: toMajor(row.total),
    totalMinor: row.total,
    count: row.count,
  };
}

async function dailySeries(userId, timeZone, days = 14, now = new Date()) {
  const end = endOfDay(now, timeZone);
  const start = startOfDay(addDays(now, -(days - 1)), timeZone);
  const txs = await Transaction.find({
    userId,
    transactionDate: { $gte: start, $lte: end },
  })
    .select('type amountMinor transactionDate')
    .lean();

  const buckets = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = addDays(now, -(days - 1 - i), timeZone);
    buckets.set(dayKey(d, timeZone), { date: dayKey(d, timeZone), income: 0, expense: 0 });
  }

  for (const tx of txs) {
    const key = dayKey(tx.transactionDate, timeZone);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.type === TRANSACTION_TYPES.INCOME) bucket.income += tx.amountMinor;
    else bucket.expense += tx.amountMinor;
  }

  return [...buckets.values()].map((b) => ({
    date: b.date,
    label: b.date.slice(5),
    income: toMajor(b.income),
    expense: toMajor(b.expense),
  }));
}

async function monthlySeries(userId, timeZone, months = 6, now = new Date()) {
  const currentParts = getZonedParts(now, timeZone);
  const keys = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const targetMonth = currentParts.month - 1 - i;
    const year = currentParts.year + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;
    const date = new Date(Date.UTC(year, month, 15));
    keys.push({ key: monthKey(date, timeZone), date, income: 0, expense: 0 });
  }
  const firstDate = keys[0].date;
  const start = startOfMonth(firstDate, timeZone);
  const end = endOfMonth(now, timeZone);
  const txs = await Transaction.find({ userId, transactionDate: { $gte: start, $lte: end } })
    .select('type amountMinor transactionDate')
    .lean();

  const map = new Map(keys.map((k) => [k.key, k]));
  for (const tx of txs) {
    const key = monthKey(tx.transactionDate, timeZone);
    const bucket = map.get(key);
    if (!bucket) continue;
    if (tx.type === TRANSACTION_TYPES.INCOME) bucket.income += tx.amountMinor;
    else bucket.expense += tx.amountMinor;
  }

  return keys.map((k) => ({
    periodKey: k.key,
    label: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone }).format(k.date),
    income: toMajor(k.income),
    expense: toMajor(k.expense),
  }));
}

async function categoryBreakdown(userId, start, end, type = TRANSACTION_TYPES.EXPENSE) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amountMinor' } } },
    { $sort: { total: -1 } },
    {
      $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  ]);
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  return rows.map((r) => ({
    categoryId: r._id,
    name: r.category?.name || 'Uncategorized',
    iconKey: r.category?.iconKey || 'tag',
    total: toMajor(r.total),
    totalMinor: r.total,
    percent: total > 0 ? Math.round((r.total / total) * 10000) / 100 : 0,
  }));
}

export async function getDashboardSummary(userId, timeZone = 'UTC', { period = 'month' } = {}) {
  const now = new Date();
  const range = resolveRange({ period, timeZone });

  const [
    todayExpense,
    monthExpense,
    monthIncome,
    periodExpense,
    periodIncome,
    top,
    recent,
    daily,
    monthly,
    monthlyBudgets,
  ] = await Promise.all([
    sumByType(
      userId,
      TRANSACTION_TYPES.EXPENSE,
      startOfDay(now, timeZone),
      endOfDay(now, timeZone)
    ),
    sumByType(
      userId,
      TRANSACTION_TYPES.EXPENSE,
      startOfMonth(now, timeZone),
      endOfMonth(now, timeZone)
    ),
    sumByType(
      userId,
      TRANSACTION_TYPES.INCOME,
      startOfMonth(now, timeZone),
      endOfMonth(now, timeZone)
    ),
    sumByType(userId, TRANSACTION_TYPES.EXPENSE, range.start, range.end),
    sumByType(userId, TRANSACTION_TYPES.INCOME, range.start, range.end),
    topCategory(userId, startOfMonth(now, timeZone), endOfMonth(now, timeZone)),
    Transaction.find({ userId })
      .sort({ transactionDate: -1, _id: -1 })
      .limit(5)
      .populate('categoryId', 'name iconKey')
      .lean(),
    dailySeries(userId, timeZone, 14, now),
    monthlySeries(userId, timeZone, 6, now),
    Budget.find({ userId, isActive: true, categoryId: null }),
  ]);

  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.amountMinor, 0);
  const remainingBudgetMinor = Math.max(0, totalBudget - monthExpense);

  return {
    period,
    todayExpense: toMajor(todayExpense),
    monthExpense: toMajor(monthExpense),
    monthIncome: toMajor(monthIncome),
    periodExpense: toMajor(periodExpense),
    periodIncome: toMajor(periodIncome),
    netBalance: toMajor(periodIncome - periodExpense),
    highestCategory: top,
    recentTransactions: recent,
    dailySeries: daily,
    monthlySeries: monthly,
    budget: {
      totalMinor: totalBudget,
      total: toMajor(totalBudget),
      spentMinor: monthExpense,
      spent: toMajor(monthExpense),
      remainingMinor: remainingBudgetMinor,
      remaining: toMajor(remainingBudgetMinor),
      percent: totalBudget > 0 ? Math.round((monthExpense / totalBudget) * 10000) / 100 : 0,
    },
  };
}

export { categoryBreakdown, dailySeries, monthlySeries };

export default { getDashboardSummary, categoryBreakdown };

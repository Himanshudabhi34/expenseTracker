import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { toMajor } from '../utils/currency.js';
import { toCsv } from '../utils/csv.js';
import { dayKey, monthKey, resolveRange } from '../utils/dateRange.js';
import { buildFilter, buildSort } from './transaction.service.js';
import { TRANSACTION_TYPES } from '../config/constants.js';

async function totals(userId, start, end) {
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        transactionDate: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$type', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const row of rows) {
    count += row.count;
    if (row._id === TRANSACTION_TYPES.INCOME) income = row.total;
    else expense = row.total;
  }
  return { income, expense, net: income - expense, count };
}

async function rangeSeries(userId, start, end, timeZone, granularity) {
  const txs = await Transaction.find({ userId, transactionDate: { $gte: start, $lte: end } })
    .select('type amountMinor transactionDate')
    .lean();

  const buckets = new Map();
  for (const tx of txs) {
    const key =
      granularity === 'monthly'
        ? monthKey(tx.transactionDate, timeZone)
        : dayKey(tx.transactionDate, timeZone);
    if (!buckets.has(key)) buckets.set(key, { date: key, income: 0, expense: 0 });
    const bucket = buckets.get(key);
    if (tx.type === TRANSACTION_TYPES.INCOME) bucket.income += tx.amountMinor;
    else bucket.expense += tx.amountMinor;
  }

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, b]) => ({
      date: key,
      label: key,
      income: toMajor(b.income),
      expense: toMajor(b.expense),
    }));
}

async function byCategory(userId, start, end, type) {
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    transactionDate: { $gte: start, $lte: end },
  };
  if (type) match.type = type;
  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { categoryId: '$categoryId', type: '$type' },
        total: { $sum: '$amountMinor' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id.categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$_id.categoryId',
        name: { $first: '$category.name' },
        iconKey: { $first: '$category.iconKey' },
        total: { $sum: '$total' },
      },
    },
    { $sort: { total: -1 } },
  ]);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return rows.map((r) => ({
    categoryId: r._id,
    name: r.name || 'Uncategorized',
    iconKey: r.iconKey || 'tag',
    total: toMajor(r.total),
    totalMinor: r.total,
    percent: grand > 0 ? Math.round((r.total / grand) * 10000) / 100 : 0,
  }));
}

function previousPeriod(range) {
  const span = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - span - 1),
    end: new Date(range.start.getTime() - 1),
  };
}

export async function getSpendingReport(userId, timeZone = 'UTC', query = {}) {
  const period = query.period || 'month';
  const range = resolveRange({
    period,
    from: query.from,
    to: query.to,
    timeZone,
  });

  const granularity = period === 'year' || query.from ? 'daily' : 'daily';

  const [current, byCat, series, topTransactions] = await Promise.all([
    totals(userId, range.start, range.end),
    byCategory(userId, range.start, range.end, TRANSACTION_TYPES.EXPENSE),
    rangeSeries(userId, range.start, range.end, timeZone, granularity),
    Transaction.find({ userId, transactionDate: { $gte: range.start, $lte: range.end } })
      .sort({ amountMinor: -1 })
      .limit(10)
      .populate('categoryId', 'name iconKey')
      .lean(),
  ]);

  const prev = previousPeriod(range);
  const previous = await totals(userId, prev.start, prev.end);

  const pctChange = (curr, old) =>
    old > 0 ? Math.round(((curr - old) / old) * 10000) / 100 : curr > 0 ? 100 : 0;

  return {
    period,
    range: { start: range.start, end: range.end },
    totals: {
      income: toMajor(current.income),
      expense: toMajor(current.expense),
      net: toMajor(current.net),
      count: current.count,
    },
    byCategory: byCat,
    series,
    topTransactions: topTransactions.map((t) => ({
      id: t._id,
      type: t.type,
      amount: toMajor(t.amountMinor),
      description: t.description,
      merchant: t.merchant,
      category: t.categoryId?.name || 'Uncategorized',
      categoryIcon: t.categoryId?.iconKey || 'tag',
      transactionDate: t.transactionDate,
      paymentMethod: t.paymentMethod,
    })),
    comparison: {
      previousRange: { start: prev.start, end: prev.end },
      expense: {
        current: toMajor(current.expense),
        previous: toMajor(previous.expense),
        changePercent: pctChange(current.expense, previous.expense),
      },
      income: {
        current: toMajor(current.income),
        previous: toMajor(previous.income),
        changePercent: pctChange(current.income, previous.income),
      },
    },
  };
}

export async function exportTransactionsCsv(userId, timeZone = 'UTC', query = {}) {
  const filter = buildFilter(userId, query, timeZone);
  const sort = buildSort(query.sort || 'date_desc');
  const limit = Math.min(parseInt(query.limit, 10) || 5000, 10000);
  const txs = await Transaction.find(filter)
    .sort(sort)
    .limit(limit)
    .populate('categoryId', 'name')
    .lean();

  const rows = txs.map((t) => ({
    Date: new Date(t.transactionDate).toISOString().slice(0, 10),
    Type: t.type,
    Amount: toMajor(t.amountMinor).toFixed(2),
    Currency: t.currency,
    Category: t.categoryId?.name || 'Uncategorized',
    Description: t.description,
    Merchant: t.merchant || '',
    PaymentMethod: t.paymentMethod,
    Notes: t.notes || '',
  }));

  return toCsv(rows, {
    columns: [
      { key: 'Date', header: 'Date' },
      { key: 'Type', header: 'Type' },
      { key: 'Amount', header: 'Amount' },
      { key: 'Currency', header: 'Currency' },
      { key: 'Category', header: 'Category' },
      { key: 'Description', header: 'Description' },
      { key: 'Merchant', header: 'Merchant' },
      { key: 'PaymentMethod', header: 'Payment Method' },
      { key: 'Notes', header: 'Notes' },
    ],
  });
}

export { totals, byCategory };

export default { getSpendingReport, exportTransactionsCsv };

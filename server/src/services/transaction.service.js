import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { toMinor } from '../utils/currency.js';
import { getPagination, buildPaginatedResult } from '../utils/pagination.js';
import { endOfDay, startOfDay } from '../utils/dateRange.js';

function buildFilter(userId, query = {}, timeZone) {
  const filter = { userId };

  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

  if (query.from || query.to) {
    filter.transactionDate = {};
    if (query.from) filter.transactionDate.$gte = startOfDay(new Date(query.from), timeZone);
    if (query.to) filter.transactionDate.$lte = endOfDay(new Date(query.to), timeZone);
  }

  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    filter.amountMinor = {};
    if (query.minAmount !== undefined) filter.amountMinor.$gte = toMinor(query.minAmount);
    if (query.maxAmount !== undefined) filter.amountMinor.$lte = toMinor(query.maxAmount);
  }

  if (query.search) {
    const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ description: rx }, { merchant: rx }, { notes: rx }];
  }

  return filter;
}

function buildSort(sort) {
  switch (sort) {
    case 'date_asc':
      return { transactionDate: 1, _id: 1 };
    case 'amount_desc':
      return { amountMinor: -1, _id: -1 };
    case 'amount_asc':
      return { amountMinor: 1, _id: 1 };
    case 'date_desc':
    default:
      return { transactionDate: -1, _id: -1 };
  }
}

export async function listTransactions(userId, query = {}, timeZone = 'UTC') {
  const { page, limit, skip } = getPagination(query);
  const filter = buildFilter(userId, query, timeZone);
  const sort = buildSort(query.sort);

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name iconKey type')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return buildPaginatedResult({ items, total, page, limit });
}

export async function getTransaction(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid transaction id');
  const tx = await Transaction.findOne({ _id: id, userId })
    .populate('categoryId', 'name iconKey type')
    .lean();
  if (!tx) throw ApiError.notFound('Transaction not found');
  return tx;
}

export async function createTransaction(userId, payload) {
  const tx = await Transaction.create({
    userId,
    type: payload.type,
    amountMinor: toMinor(payload.amount),
    currency: payload.currency || undefined,
    categoryId: payload.categoryId,
    description: payload.description,
    merchant: payload.merchant || '',
    transactionDate: payload.transactionDate,
    paymentMethod: payload.paymentMethod || 'other',
    notes: payload.notes || '',
  });
  return getTransaction(userId, tx._id);
}

export async function updateTransaction(userId, id, payload) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid transaction id');
  const update = {};
  if (payload.type !== undefined) update.type = payload.type;
  if (payload.amount !== undefined) update.amountMinor = toMinor(payload.amount);
  if (payload.currency !== undefined) update.currency = payload.currency;
  if (payload.categoryId !== undefined) update.categoryId = payload.categoryId;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.merchant !== undefined) update.merchant = payload.merchant;
  if (payload.transactionDate !== undefined) update.transactionDate = payload.transactionDate;
  if (payload.paymentMethod !== undefined) update.paymentMethod = payload.paymentMethod;
  if (payload.notes !== undefined) update.notes = payload.notes;

  const tx = await Transaction.findOneAndUpdate({ _id: id, userId }, update, {
    new: true,
    runValidators: true,
  });
  if (!tx) throw ApiError.notFound('Transaction not found');
  return getTransaction(userId, id);
}

export async function deleteTransaction(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid transaction id');
  const tx = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!tx) throw ApiError.notFound('Transaction not found');
  return { id };
}

export { buildFilter, buildSort };
export default {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

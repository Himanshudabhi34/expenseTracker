import * as transactionService from '../services/transaction.service.js';
import * as notificationService from '../services/notification.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

async function refreshNotifications(req, transaction) {
  await notificationService.syncBudgetAlerts(req.user._id, { timeZone: req.user.timezone });
  if (transaction) {
    await notificationService.notifyLargeTransaction(req.user._id, transaction, {
      currency: req.user.currency,
    });
  }
}

export const list = asyncHandler(async (req, res) => {
  const result = await transactionService.listTransactions(
    req.user._id,
    req.query,
    req.user.timezone
  );
  sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransaction(req.user._id, req.params.id);
  sendSuccess(res, { transaction });
});

export const create = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user._id, req.body);
  await refreshNotifications(req, transaction);
  sendSuccess(res, { transaction }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(
    req.user._id,
    req.params.id,
    req.body
  );
  await refreshNotifications(req, transaction);
  sendSuccess(res, { transaction });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await transactionService.deleteTransaction(req.user._id, req.params.id);
  sendSuccess(res, result);
});

export default { list, getOne, create, update, remove };

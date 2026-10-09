import * as reportService from '../services/report.service.js';
import * as suggestionService from '../services/suggestion.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

export const spending = asyncHandler(async (req, res) => {
  const report = await reportService.getSpendingReport(req.user._id, req.user.timezone, req.query);
  sendSuccess(res, report);
});

export const suggestions = asyncHandler(async (req, res) => {
  const data = await suggestionService.getSavingSuggestions(req.user._id, req.user.timezone);
  sendSuccess(res, data);
});

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await reportService.exportTransactionsCsv(req.user._id, req.user.timezone, req.query);
  const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

export default { spending, suggestions, exportCsv };

import { byCategory, totals } from './report.service.js';
import { addMonths, endOfMonth, monthLabel, startOfMonth } from '../utils/dateRange.js';
import { TRANSACTION_TYPES } from '../config/constants.js';
import { toMajor } from '../utils/currency.js';

const MILESTONE = 500;

/**
 * Builds simple, explainable insights by comparing the current month against the
 * previous month. Every insight states the exact period being compared.
 */
export async function getSavingSuggestions(userId, timeZone = 'UTC', now = new Date()) {
  const currentStart = startOfMonth(now, timeZone);
  const currentEnd = endOfMonth(now, timeZone);
  const prevRef = addMonths(now, -1, timeZone);
  const prevStart = startOfMonth(prevRef, timeZone);
  const prevEnd = endOfMonth(prevRef, timeZone);

  const [currentTotals, prevTotals, currentCats, prevCats] = await Promise.all([
    totals(userId, currentStart, currentEnd),
    totals(userId, prevStart, prevEnd),
    byCategory(userId, currentStart, currentEnd, TRANSACTION_TYPES.EXPENSE),
    byCategory(userId, prevStart, prevEnd, TRANSACTION_TYPES.EXPENSE),
  ]);

  const currentLabel = monthLabel(now, timeZone);
  const prevLabel = monthLabel(prevRef, timeZone);
  const prevMap = new Map(prevCats.map((c) => [c.name, c.total]));
  const suggestions = [];

  for (const cat of currentCats) {
    const prevTotal = prevMap.get(cat.name) || 0;
    const diff = cat.total - prevTotal;
    if (prevTotal > 0 && diff >= MILESTONE) {
      const change = Math.round((diff / prevTotal) * 100);
      suggestions.push({
        type: 'increase',
        severity: change >= 50 ? 'high' : 'medium',
        category: cat.name,
        title: `${cat.name} spending is up`,
        message: `Your ${cat.name.toLowerCase()} expenses increased from ₹${prevTotal.toFixed(
          2
        )} in ${prevLabel} to ₹${cat.total.toFixed(2)} in ${currentLabel}${
          change ? `, an increase of ${change}%` : ''
        }.`,
        period: { current: currentLabel, previous: prevLabel },
      });
    } else if (prevTotal > 0 && diff <= -MILESTONE) {
      const change = Math.round((Math.abs(diff) / prevTotal) * 100);
      suggestions.push({
        type: 'decrease',
        severity: 'positive',
        category: cat.name,
        title: `${cat.name} spending is down`,
        message: `Great job! Your ${cat.name.toLowerCase()} expenses dropped from ₹${prevTotal.toFixed(
          2
        )} in ${prevLabel} to ₹${cat.total.toFixed(2)} in ${currentLabel}, a decrease of ${change}%.`,
        period: { current: currentLabel, previous: prevLabel },
      });
    }
  }

  if (prevTotals.expense > 0) {
    const overallDiff = currentTotals.expense - prevTotals.expense;
    const change = Math.round((overallDiff / prevTotals.expense) * 100);
    if (Math.abs(change) >= 10) {
      suggestions.push({
        type: overallDiff > 0 ? 'increase' : 'decrease',
        severity: overallDiff > 0 ? 'medium' : 'positive',
        category: 'Overall',
        title: `Total spending is ${overallDiff > 0 ? 'up' : 'down'}`,
        message: `Your total expenses went from ₹${toMajor(prevTotals.expense).toFixed(
          2
        )} in ${prevLabel} to ₹${toMajor(currentTotals.expense).toFixed(2)} in ${currentLabel} (${
          overallDiff > 0 ? '+' : ''
        }${change}%).`,
        period: { current: currentLabel, previous: prevLabel },
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'info',
      severity: 'info',
      category: 'Summary',
      title: 'Spending is stable',
      message: `No significant changes in your spending between ${prevLabel} and ${currentLabel}. Keep it up!`,
      period: { current: currentLabel, previous: prevLabel },
    });
  }

  const priority = { high: 0, medium: 1, positive: 2, info: 3 };
  suggestions.sort((a, b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9));

  return {
    period: { current: currentLabel, previous: prevLabel },
    suggestions,
  };
}

export default { getSavingSuggestions };

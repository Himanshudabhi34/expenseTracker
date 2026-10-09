import { scoreCategories } from './categorizer.js';

export const INTENTS = Object.freeze({
  ENTRY: 'entry',
  DAILY_EXPENSE: 'daily_expense',
  MONTHLY_EXPENSE: 'monthly_expense',
  PERIOD_EXPENSE: 'period_expense',
  INCOME_TOTAL: 'income_total',
  CATEGORY_SPENDING: 'category_spending',
  TOP_CATEGORIES: 'top_categories',
  LARGEST_TRANSACTION: 'largest_transaction',
  MONTH_COMPARISON: 'month_comparison',
  BUDGET_STATUS: 'budget_status',
  SAVINGS_GOALS: 'savings_goals',
  HELP: 'help',
  UNKNOWN: 'unknown',
});

const QUESTION_HINTS = [
  'how much',
  'how many',
  'what',
  'which',
  'show',
  'tell',
  'compare',
  'total',
  'list',
  'give me',
  'summar',
  'where',
  'do i',
  'did i',
  'am i',
  'can you',
];
const ENTRY_HINTS = [
  'spent',
  'paid',
  'pay',
  'bought',
  'purchased',
  'received',
  'receive',
  'earned',
  'earn',
  'got',
  'added',
  'salary',
  'expense of',
  'income of',
];

export function detectPeriod(text) {
  const lower = text.toLowerCase();
  if (/\byesterday\b/.test(lower)) return 'yesterday';
  if (/\b(today|tonight|this morning|this evening)\b/.test(lower)) return 'today';
  if (/\b(this|current)\s+week\b/.test(lower)) return 'week';
  if (/\blast\s+month\b|\bprevious\s+month\b/.test(lower)) return 'last_month';
  if (/\b(this|current)?\s*month\b/.test(lower)) return 'month';
  if (/\bthis\s+year\b|\byearly\b|\bannual\b/.test(lower)) return 'year';
  return null;
}

function extractCategoryQuery(text) {
  const scored = scoreCategories(text);
  if (scored.length > 0) return scored[0].category;
  const onMatch = text.match(
    /\bon\s+([a-z\s]{3,30}?)(?:\?|$|\bthis\b|\blast\b|\btoday\b|\byesterday\b)/i
  );
  if (onMatch) return onMatch[1].trim();
  return null;
}

/**
 * Classifies an agent message as a transaction entry, a question, or unknown.
 */
export function detectIntent(input) {
  const text = String(input || '').trim();
  const lower = text.toLowerCase();

  if (!text) return { kind: 'unknown', intent: INTENTS.UNKNOWN, entities: {} };

  const isQuestion = /\?$/.test(text) || QUESTION_HINTS.some((h) => lower.includes(h));
  const hasAmount =
    /(?:₹|rs\.?|inr)\s*[\d,]+|\b\d[\d,]*(?:\.\d+)?\s*(?:k|lakh)?\s*(?:rupees|rs)?\b/i.test(text);
  const hasEntryVerb = ENTRY_HINTS.some((h) => lower.includes(h));

  // Explicit help request.
  if (/^(help|what can you do|commands|examples)\b/.test(lower)) {
    return { kind: 'question', intent: INTENTS.HELP, entities: {} };
  }

  // Entry: has an amount AND an entry verb AND is not phrased as a question.
  if (hasAmount && hasEntryVerb && !isQuestion) {
    return { kind: 'entry', intent: INTENTS.ENTRY, entities: {} };
  }

  const period = detectPeriod(text);

  if (/(budget|remaining budget|budget left|over budget)/.test(lower)) {
    return { kind: 'question', intent: INTENTS.BUDGET_STATUS, entities: { period } };
  }
  if (/(goal|saving target|savings goal|save for|emergency fund)/.test(lower)) {
    return { kind: 'question', intent: INTENTS.SAVINGS_GOALS, entities: {} };
  }
  if (
    /(compare|vs\.?|versus|compared to|last month)/.test(lower) &&
    /(month|spend|expense|income)/.test(lower)
  ) {
    return { kind: 'question', intent: INTENTS.MONTH_COMPARISON, entities: {} };
  }
  if (
    /(highest category|top categor|most spend|where.*(spend|spending)|biggest category|which category)/.test(
      lower
    )
  ) {
    return {
      kind: 'question',
      intent: INTENTS.TOP_CATEGORIES,
      entities: { period: period || 'month' },
    };
  }
  if (
    /(largest|biggest|highest|most expensive)\s+(expense|transaction|purchase|payment)|(?:largest|biggest).*?(expense|spent)/.test(
      lower
    )
  ) {
    return {
      kind: 'question',
      intent: INTENTS.LARGEST_TRANSACTION,
      entities: { period: period || 'month' },
    };
  }
  if (/(income|earn|salary|received)/.test(lower)) {
    return {
      kind: 'question',
      intent: INTENTS.INCOME_TOTAL,
      entities: { period: period || 'month' },
    };
  }
  if (/(on)\s+[a-z]/.test(lower) && /(spend|spent|expense|pay|paid)/.test(lower)) {
    return {
      kind: 'question',
      intent: INTENTS.CATEGORY_SPENDING,
      entities: { categoryQuery: extractCategoryQuery(text), period: period || 'month' },
    };
  }
  if (/\btoday\b|\byesterday\b/.test(lower) && /(spend|spent|expense)/.test(lower)) {
    return {
      kind: 'question',
      intent: INTENTS.DAILY_EXPENSE,
      entities: { period: period || 'today' },
    };
  }
  if (
    /(total|how much).*(spend|spent|expense)|(spend|spent|expense).*(total|this month)/.test(lower)
  ) {
    return {
      kind: 'question',
      intent: period && period !== 'month' ? INTENTS.PERIOD_EXPENSE : INTENTS.MONTHLY_EXPENSE,
      entities: { period: period || 'month' },
    };
  }

  if (hasAmount && hasEntryVerb) {
    return { kind: 'entry', intent: INTENTS.ENTRY, entities: {} };
  }

  return { kind: 'unknown', intent: INTENTS.UNKNOWN, entities: { period } };
}

export default { detectIntent, detectPeriod, INTENTS };

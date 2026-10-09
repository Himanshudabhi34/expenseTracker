import { PAYMENT_METHOD_VALUES } from '../../config/constants.js';
import { executeIntent } from '../expenseAgent/queryExecutor.js';
import { buildEntryDraft } from '../expenseAgent/responseBuilder.js';
import { listCategories, getFallbackCategory } from '../../services/category.service.js';

export const PERIODS = ['today', 'yesterday', 'week', 'month', 'last_month', 'year'];

const periodProp = {
  type: 'string',
  enum: PERIODS,
  description: 'Time window. Defaults to "month". Use "last_month" for the previous calendar month.',
};

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_expenses',
      description: 'Total expenses (and count) for a period.',
      parameters: {
        type: 'object',
        properties: { period: periodProp },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_income',
      description: 'Total income (and count) for a period.',
      parameters: {
        type: 'object',
        properties: { period: periodProp },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_spending',
      description: 'Total spending in a specific category for a period.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category name, e.g. "Travel & Fuel".' },
          period: periodProp,
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_categories',
      description: 'The user\'s highest-spending categories for a period.',
      parameters: {
        type: 'object',
        properties: { period: periodProp },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_largest_expense',
      description: 'The single largest expense for a period.',
      parameters: {
        type: 'object',
        properties: { period: periodProp },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_months',
      description: 'Compare this month against last month (expenses and income).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: 'Current budget usage: spent, amount, remaining and percentage.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_goals',
      description: 'Saving goals and their progress.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'List available categories the user can record against.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_transaction',
      description:
        'Prepare (do NOT save) a transaction the user described. The user will confirm before it is recorded. Always use this for any request to add income or an expense.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['expense', 'income'], description: 'Defaults to expense.' },
          amount: { type: 'number', description: 'Amount in the user\'s currency.' },
          description: { type: 'string', description: 'Short description, e.g. "Dinner".' },
          category: { type: 'string', description: 'Best matching category name.' },
          date: { type: 'string', description: 'ISO date (YYYY-MM-DD). Defaults to today.' },
          paymentMethod: { type: 'string', enum: PAYMENT_METHOD_VALUES },
        },
        required: ['amount', 'description'],
      },
    },
  },
];

export function parseToolArguments(args) {
  if (!args) return {};
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }
  if (typeof args === 'object') return args;
  return {};
}

async function resolveCategory(userId, name, type) {
  const categories = await listCategories(userId);
  const lower = (name || '').toLowerCase();
  const match = lower
    ? categories.find((c) => c.name.toLowerCase() === lower) ||
      categories.find((c) => c.name.toLowerCase().includes(lower))
    : null;
  if (match) return { id: match._id, name: match.name, confidence: 'high' };

  const fallback = await getFallbackCategory(type);
  if (fallback) return { id: fallback._id, name: fallback.name, confidence: 'low' };
  return { id: null, name: 'Other', confidence: 'low' };
}

function normalizePaymentMethod(method) {
  return PAYMENT_METHOD_VALUES.includes(method) ? method : 'other';
}

async function buildTransactionDraft(args, { userId, currency }) {
  const type = args.type === 'income' ? 'income' : 'expense';
  const amount = Number(args.amount);
  const hasAmount = Number.isFinite(amount) && amount > 0;
  const missing = [];
  if (!hasAmount) missing.push('amount');
  if (!args.description) missing.push('description');

  let date = null;
  if (args.date) {
    const parsedDate = new Date(args.date);
    date = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsed = {
    type,
    amount: hasAmount ? amount : null,
    description: args.description || 'Transaction',
    date,
    paymentMethod: normalizePaymentMethod(args.paymentMethod),
    missing,
  };

  const category = await resolveCategory(userId, args.category, type);
  const built = buildEntryDraft(parsed, category, { currency });
  return { result: { ok: true, awaitingConfirmation: true }, draft: built.draft, reply: built.reply };
}

/**
 * Executes a single tool call against real data.
 * Returns { result, draft?, reply? }.
 */
export async function executeTool(name, args, ctx) {
  const { userId, timeZone, currency } = ctx;
  const intentCtx = { userId, timeZone, now: ctx.now };

  switch (name) {
    case 'get_expenses':
      return { result: await executeIntent('period_expense', { period: args.period }, intentCtx) };
    case 'get_income':
      return { result: await executeIntent('income_total', { period: args.period }, intentCtx) };
    case 'get_category_spending':
      return {
        result: await executeIntent(
          'category_spending',
          { categoryQuery: args.category, period: args.period },
          intentCtx
        ),
      };
    case 'get_top_categories':
      return { result: await executeIntent('top_categories', { period: args.period }, intentCtx) };
    case 'get_largest_expense':
      return {
        result: await executeIntent('largest_transaction', { period: args.period }, intentCtx),
      };
    case 'compare_months':
      return { result: await executeIntent('month_comparison', {}, intentCtx) };
    case 'get_budget_status':
      return { result: await executeIntent('budget_status', {}, intentCtx) };
    case 'get_goals':
      return { result: await executeIntent('savings_goals', {}, intentCtx) };
    case 'list_categories': {
      const categories = await listCategories(userId);
      return { result: { categories: categories.map((c) => ({ name: c.name, type: c.type })) } };
    }
    case 'draft_transaction':
      return buildTransactionDraft(args, { userId, currency });
    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}

export default { TOOL_DEFINITIONS, executeTool, parseToolArguments, PERIODS };

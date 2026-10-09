/**
 * Golden evaluation cases derived directly from the agent requirements in the
 * project specification (section 2.8 "Expense Agent" and 8.2 "Supported Initial
 * Intents"). Each case maps a requirement to expected behaviour so accuracy can
 * be measured, not guessed.
 *
 * Seeded dataset (isolated eval DB):
 *   this month  : Food & Dining ₹450, Travel & Fuel ₹1,200, Groceries ₹300 -> ₹1,950 (3 tx)
 *   this month  : income Salary ₹50,000
 *   last month  : Groceries ₹1,000
 *
 * expect.tools / expect.toolArgs are checked in LLM mode only.
 * expect.intents are checked in rule-based mode only.
 * expect.draft / expect.reply* are checked in both modes.
 */
export const EVAL_CASES = [
  // --- Natural-language expense entry (spec 2.8) ---
  {
    id: 'entry-expense-dinner',
    requirement: 'NL entry — expense',
    input: 'Spent ₹250 on dinner yesterday',
    expect: {
      kind: 'draft',
      draft: { type: 'expense', amount: 250, categoryName: 'Food & Dining' },
    },
  },
  {
    id: 'entry-expense-petrol',
    requirement: 'NL entry — expense',
    input: 'Paid ₹500 for petrol',
    expect: {
      kind: 'draft',
      draft: { type: 'expense', amount: 500, categoryName: 'Travel & Fuel' },
    },
  },
  {
    id: 'entry-expense-coffee',
    requirement: 'NL entry — expense',
    input: 'coffee 120 rupees',
    expect: { kind: 'draft', draft: { type: 'expense', amount: 120 } },
  },
  // --- Natural-language income entry ---
  {
    id: 'entry-income-salary',
    requirement: 'NL entry — income',
    input: 'Received ₹45,000 salary',
    expect: {
      kind: 'draft',
      draft: { type: 'income', amount: 45000, categoryName: 'Salary' },
    },
  },

  // --- Daily expense total (spec 2.8 / 8.2) ---
  {
    id: 'daily-total-today',
    requirement: 'Daily expense total',
    input: 'How much did I spend today?',
    expect: {
      kind: 'answer',
      tools: ['get_expenses'],
      toolArgs: { period: /today|day/i },
      intents: ['daily_expense', 'period_expense'],
      replyMatches: '1,?950',
    },
  },

  // --- Monthly expense total ---
  {
    id: 'monthly-total',
    requirement: 'Monthly expense total',
    input: 'What is my total spending this month?',
    expect: {
      kind: 'answer',
      tools: ['get_expenses'],
      intents: ['period_expense', 'monthly_expense'],
      replyMatches: '1,?950',
    },
  },

  // --- Income total ---
  {
    id: 'income-total',
    requirement: 'Income total',
    input: 'How much income did I receive this month?',
    expect: {
      kind: 'answer',
      tools: ['get_income'],
      intents: ['income_total'],
      replyMatches: '50,?000',
    },
  },

  // --- Category spending total ---
  {
    id: 'category-petrol',
    requirement: 'Category spending',
    input: 'How much did I spend on petrol?',
    expect: {
      kind: 'answer',
      tools: ['get_category_spending'],
      toolArgs: { category: /travel|fuel|petrol/i },
      intents: ['category_spending'],
      replyMatches: '1,?200',
    },
  },
  {
    id: 'category-groceries',
    requirement: 'Category spending',
    input: 'How much did I spend on groceries this month?',
    expect: {
      kind: 'answer',
      tools: ['get_category_spending'],
      toolArgs: { category: /grocer/i },
      intents: ['category_spending'],
      replyMatches: '\\b300\\b',
    },
  },

  // --- Top spending categories ---
  {
    id: 'top-categories',
    requirement: 'Top categories',
    input: 'Which category has the highest expenses?',
    expect: {
      kind: 'answer',
      tools: ['get_top_categories'],
      intents: ['top_categories'],
      replyMatches: 'travel',
    },
  },

  // --- Largest transaction ---
  {
    id: 'largest-transaction',
    requirement: 'Largest transaction',
    input: 'Show my largest expense this month.',
    expect: {
      kind: 'answer',
      tools: ['get_largest_expense'],
      intents: ['largest_transaction'],
      replyMatches: '1,?200',
    },
  },

  // --- Current vs previous month comparison ---
  {
    id: 'month-comparison',
    requirement: 'Month comparison',
    input: 'Compare this month with last month.',
    expect: {
      kind: 'answer',
      tools: ['compare_months'],
      intents: ['month_comparison'],
      replyMatches: '1,?950',
    },
  },

  // --- No fabrication on empty data (spec: "must not invent totals") ---
  {
    id: 'empty-monthly',
    requirement: 'No-fabrication (empty data)',
    scope: 'empty',
    input: 'How much did I spend this month?',
    expect: {
      kind: 'answer',
      tools: ['get_expenses'],
      intents: ['period_expense', 'monthly_expense'],
      replyMatches: '(no |not |haven|don|nothing)',
    },
  },
  {
    id: 'empty-largest',
    requirement: 'No-fabrication (empty data)',
    scope: 'empty',
    input: 'What is my largest expense this month?',
    expect: {
      kind: 'answer',
      tools: ['get_largest_expense'],
      intents: ['largest_transaction'],
      replyMatches: '(no |not |haven|don|nothing)',
    },
  },
];

export default { EVAL_CASES };

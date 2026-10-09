export const TRANSACTION_TYPES = Object.freeze({
  EXPENSE: 'expense',
  INCOME: 'income',
});

export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPES);

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  DEBIT_CARD: 'debit_card',
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other',
});

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHODS);

export const BUDGET_PERIODS = Object.freeze({
  MONTHLY: 'monthly',
});

export const BUDGET_PERIOD_VALUES = Object.values(BUDGET_PERIODS);

export const GOAL_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

export const GOAL_STATUS_VALUES = Object.values(GOAL_STATUS);

export const DEFAULT_WARNING_THRESHOLDS = [80, 100];

// A single expense at or above this amount (minor units) raises a notification.
// Defaults to ₹10,000.
export const LARGE_TRANSACTION_MINOR = 1_000_000;

export const NOTIFICATION_TYPES = Object.freeze({
  BUDGET_WARNING: 'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  GOAL_COMPLETED: 'goal_completed',
  LARGE_TRANSACTION: 'large_transaction',
  MONTHLY_SUMMARY: 'monthly_summary',
});

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);

export const NOTIFICATION_LEVELS = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
  SUCCESS: 'success',
});

export const NOTIFICATION_LEVEL_VALUES = Object.values(NOTIFICATION_LEVELS);

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', iconKey: 'utensils' },
  { name: 'Groceries', type: 'expense', iconKey: 'shopping-basket' },
  { name: 'Travel & Fuel', type: 'expense', iconKey: 'car' },
  { name: 'Rent & Housing', type: 'expense', iconKey: 'home' },
  { name: 'Utilities & Bills', type: 'expense', iconKey: 'bolt' },
  { name: 'Shopping', type: 'expense', iconKey: 'bag-shopping' },
  { name: 'Healthcare', type: 'expense', iconKey: 'heart-pulse' },
  { name: 'Education', type: 'expense', iconKey: 'graduation-cap' },
  { name: 'Entertainment', type: 'expense', iconKey: 'film' },
  { name: 'Personal Care', type: 'expense', iconKey: 'spa' },
  { name: 'Subscriptions', type: 'expense', iconKey: 'repeat' },
  { name: 'Salary', type: 'income', iconKey: 'money-bill-wave' },
  { name: 'Freelance Income', type: 'income', iconKey: 'laptop-code' },
  { name: 'Other', type: 'both', iconKey: 'ellipsis' },
];

export const FALLBACK_CATEGORY = 'Other';

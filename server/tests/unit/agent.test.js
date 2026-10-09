import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAmount,
  parseDate,
  parsePaymentMethod,
  parseExpenseEntry,
} from '../../src/agents/expenseAgent/parser.js';
import {
  suggestCategoryName,
  detectIncomeIntent,
} from '../../src/agents/expenseAgent/categorizer.js';
import { detectIntent, INTENTS } from '../../src/agents/expenseAgent/intentDetector.js';

const now = new Date('2026-10-09T12:00:00Z');
const TZ = 'Asia/Kolkata';

describe('parser - amount', () => {
  test('parses rupee-prefixed amounts', () => {
    assert.equal(parseAmount('Spent ₹250 on dinner').amount, 250);
    assert.equal(parseAmount('Rs 1,200 for electricity').amount, 1200);
  });

  test('parses k and lakh suffixes', () => {
    assert.equal(parseAmount('paid 45k salary').amount, 45000);
    assert.equal(parseAmount('bought for 1.5k').amount, 1500);
    assert.equal(parseAmount('house rent 2 lakh').amount, 200000);
  });

  test('returns null when no amount', () => {
    assert.equal(parseAmount('how much did i spend').amount, null);
  });
});

describe('parser - date', () => {
  test('resolves yesterday', () => {
    const { date } = parseDate('spent 100 yesterday', { now, timeZone: TZ });
    assert.equal(date.toISOString().slice(0, 10), '2026-10-08');
  });

  test('resolves today', () => {
    const { date } = parseDate('spent 100 today', { now, timeZone: TZ });
    assert.equal(date.toISOString().slice(0, 10), '2026-10-09');
  });

  test('resolves explicit date', () => {
    const { date } = parseDate('paid on 5 Jan', { now, timeZone: TZ });
    assert.equal(date.getUTCMonth(), 0);
    assert.equal(date.getUTCDate(), 5);
  });

  test('returns null when no date', () => {
    assert.equal(parseDate('spent 100 on food', { now, timeZone: TZ }).date, null);
  });
});

describe('parser - payment method', () => {
  test('detects upi and cash', () => {
    assert.equal(parsePaymentMethod('paid via upi'), 'upi');
    assert.equal(parsePaymentMethod('paid cash'), 'cash');
  });
});

describe('parser - full entry', () => {
  test('extracts a complete expense draft', () => {
    const parsed = parseExpenseEntry('Spent ₹250 on dinner yesterday', { now, timeZone: TZ });
    assert.equal(parsed.amount, 250);
    assert.equal(parsed.type, 'expense');
    assert.equal(parsed.description.toLowerCase(), 'dinner');
    assert.deepEqual(parsed.missing, []);
  });

  test('flags missing amount', () => {
    const parsed = parseExpenseEntry('paid for groceries yesterday', { now, timeZone: TZ });
    assert.ok(parsed.missing.includes('amount'));
  });
});

describe('categorizer', () => {
  test('suggests Food & Dining for lunch', () => {
    assert.equal(suggestCategoryName('spent 150 on lunch').name, 'Food & Dining');
  });

  test('suggests Travel & Fuel for petrol', () => {
    assert.equal(suggestCategoryName('paid 500 for petrol').name, 'Travel & Fuel');
  });

  test('falls back to Other when unknown', () => {
    assert.equal(suggestCategoryName('xyz abc').name, 'Other');
  });

  test('detects income intent', () => {
    assert.equal(detectIncomeIntent('received salary'), true);
    assert.equal(detectIncomeIntent('spent on dinner'), false);
  });
});

describe('intentDetector', () => {
  test('detects entry vs question', () => {
    assert.equal(detectIntent('Spent ₹250 on dinner yesterday').kind, 'entry');
    assert.equal(detectIntent('How much did I spend today?').kind, 'question');
  });

  test('detects specific intents', () => {
    assert.equal(detectIntent('How much did I spend today?').intent, INTENTS.DAILY_EXPENSE);
    assert.equal(
      detectIntent('What is my total spending this month?').intent,
      INTENTS.MONTHLY_EXPENSE
    );
    assert.equal(
      detectIntent('Which category has the highest expenses?').intent,
      INTENTS.TOP_CATEGORIES
    );
    assert.equal(
      detectIntent('Show my largest expense this month').intent,
      INTENTS.LARGEST_TRANSACTION
    );
    assert.equal(
      detectIntent('Compare this month with last month').intent,
      INTENTS.MONTH_COMPARISON
    );
    assert.equal(
      detectIntent('How much income did I receive this month?').intent,
      INTENTS.INCOME_TOTAL
    );
    assert.equal(detectIntent('How much budget do I have left?').intent, INTENTS.BUDGET_STATUS);
  });

  test('detects category spending', () => {
    const result = detectIntent('How much did I spend on petrol?');
    assert.equal(result.intent, INTENTS.CATEGORY_SPENDING);
    assert.equal(result.entities.categoryQuery, 'Travel & Fuel');
  });
});

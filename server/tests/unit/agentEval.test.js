import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCase } from '../../scripts/agentEval/scoring.js';
import { EVAL_CASES } from '../../scripts/agentEval/cases.js';

const caseById = (id) => EVAL_CASES.find((c) => c.id === id);

describe('agent eval — scoring', () => {
  test('golden cases are well-formed and uniquely identified', () => {
    assert.ok(EVAL_CASES.length >= 10);
    const ids = new Set();
    for (const c of EVAL_CASES) {
      assert.equal(typeof c.id, 'string');
      assert.equal(typeof c.requirement, 'string');
      assert.equal(typeof c.input, 'string');
      assert.ok(c.expect && typeof c.expect === 'object');
      assert.ok(!ids.has(c.id), `duplicate id: ${c.id}`);
      ids.add(c.id);
    }
  });

  test('passes an LLM answer that used the right tool and grounded the number', () => {
    const result = {
      kind: 'answer',
      reply: 'You spent ₹1,950 today across 3 transactions.',
      data: { source: 'llm', toolCalls: [{ name: 'get_expenses', args: { period: 'today' } }] },
    };
    const scored = scoreCase(caseById('daily-total-today'), result, 'llm');
    assert.equal(scored.pass, true);
  });

  test('fails when the LLM called the wrong tool', () => {
    const result = {
      kind: 'answer',
      reply: 'You spent ₹1,950 today.',
      data: { toolCalls: [{ name: 'get_income', args: { period: 'today' } }] },
    };
    const scored = scoreCase(caseById('daily-total-today'), result, 'llm');
    assert.equal(scored.pass, false);
    assert.ok(scored.checks.some((c) => c.name === 'tool' && !c.ok));
  });

  test('fails when the number is not grounded (fabricated)', () => {
    const result = {
      kind: 'answer',
      reply: 'You spent ₹9,999 this month.',
      data: { toolCalls: [{ name: 'get_expenses', args: {} }] },
    };
    const scored = scoreCase(caseById('monthly-total'), result, 'llm');
    assert.equal(scored.pass, false);
    assert.ok(scored.checks.some((c) => c.name === 'replyMatches' && !c.ok));
  });

  test('checks category tool arguments with a regex', () => {
    const good = {
      kind: 'answer',
      reply: 'You spent ₹1,200 on Travel & Fuel.',
      data: { toolCalls: [{ name: 'get_category_spending', args: { category: 'Travel & Fuel' } }] },
    };
    assert.equal(scoreCase(caseById('category-petrol'), good, 'llm').pass, true);

    const bad = {
      kind: 'answer',
      reply: 'You spent ₹1,200 on Food & Dining.',
      data: { toolCalls: [{ name: 'get_category_spending', args: { category: 'Food & Dining' } }] },
    };
    assert.equal(scoreCase(caseById('category-petrol'), bad, 'llm').pass, false);
  });

  test('scores rule-based mode via intent', () => {
    const result = {
      kind: 'answer',
      reply: 'You spent ₹1,950.00 in Oct 2026 across 3 transactions.',
      data: { intent: 'period_expense' },
    };
    assert.equal(scoreCase(caseById('monthly-total'), result, 'rules').pass, true);

    const wrong = { kind: 'answer', reply: 'x', data: { intent: 'income_total' } };
    assert.equal(scoreCase(caseById('monthly-total'), wrong, 'rules').pass, false);
  });

  test('checks natural-language draft fields numerically', () => {
    const result = {
      kind: 'draft',
      reply: 'confirm?',
      draft: { type: 'expense', amount: 250, categoryName: 'Food & Dining' },
    };
    assert.equal(scoreCase(caseById('entry-expense-dinner'), result, 'llm').pass, true);

    const wrongAmount = {
      kind: 'draft',
      reply: 'confirm?',
      draft: { type: 'expense', amount: 25, categoryName: 'Food & Dining' },
    };
    assert.equal(scoreCase(caseById('entry-expense-dinner'), wrongAmount, 'llm').pass, false);
  });

  test('empty-data cases require a no-data style reply', () => {
    const result = {
      kind: 'answer',
      reply: 'You have no expenses recorded for this month.',
      data: { toolCalls: [{ name: 'get_expenses', args: {} }] },
    };
    assert.equal(scoreCase(caseById('empty-monthly'), result, 'llm').pass, true);

    const fabricated = {
      kind: 'answer',
      reply: 'You spent ₹4,321 this month.',
      data: { toolCalls: [{ name: 'get_expenses', args: {} }] },
    };
    assert.equal(scoreCase(caseById('empty-monthly'), fabricated, 'llm').pass, false);
  });
});

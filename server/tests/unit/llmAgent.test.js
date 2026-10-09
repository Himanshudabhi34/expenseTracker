import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_DEFINITIONS, parseToolArguments } from '../../src/agents/llmAgent/tools.js';
import { buildSystemPrompt } from '../../src/agents/llmAgent/index.js';

describe('llm agent tools', () => {
  test('exposes function-style tool definitions', () => {
    assert.ok(TOOL_DEFINITIONS.length >= 8);
    for (const tool of TOOL_DEFINITIONS) {
      assert.equal(tool.type, 'function');
      assert.equal(typeof tool.function.name, 'string');
      assert.equal(typeof tool.function.description, 'string');
      assert.equal(tool.function.parameters.type, 'object');
    }
  });

  test('includes a draft_transaction tool that requires amount and description', () => {
    const draftTool = TOOL_DEFINITIONS.find((t) => t.function.name === 'draft_transaction');
    assert.ok(draftTool);
    assert.deepEqual(draftTool.function.parameters.required, ['amount', 'description']);
  });

  test('parses tool arguments from objects and JSON strings', () => {
    assert.deepEqual(parseToolArguments({ amount: 10 }), { amount: 10 });
    assert.deepEqual(parseToolArguments('{"amount":25,"period":"week"}'), {
      amount: 25,
      period: 'week',
    });
    assert.deepEqual(parseToolArguments('not-json'), {});
    assert.deepEqual(parseToolArguments(null), {});
  });
});

describe('llm system prompt', () => {
  test('mentions currency, timezone and today', () => {
    const prompt = buildSystemPrompt({
      currency: 'INR',
      timeZone: 'Asia/Kolkata',
      now: new Date('2026-10-09T06:00:00Z'),
    });
    assert.match(prompt, /INR/);
    assert.match(prompt, /Asia\/Kolkata/);
    assert.match(prompt, /2026-10-09/);
    assert.match(prompt, /draft_transaction/);
  });
});

/**
 * Pure scoring for the agent evaluation harness. Kept free of I/O so it can be
 * unit tested without a database or a live LLM.
 */

function matchValue(actual, expected) {
  if (expected instanceof RegExp) return typeof actual === 'string' && expected.test(actual);
  if (Array.isArray(expected)) return expected.some((value) => matchValue(actual, value));
  if (typeof expected === 'string') {
    return typeof actual === 'string' && actual.toLowerCase() === expected.toLowerCase();
  }
  return actual === expected;
}

function findToolCall(toolCalls, names, argExpectations) {
  const list = Array.isArray(toolCalls) ? toolCalls : [];
  return list.some((call) => {
    if (names && !names.includes(call.name)) return false;
    if (!argExpectations) return true;
    const args = call.args || {};
    return Object.entries(argExpectations).every(([key, value]) => matchValue(args[key], value));
  });
}

function describe(value) {
  if (value instanceof RegExp) return value.toString();
  if (Array.isArray(value)) return `[${value.map(describe).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value)
      .map(([key, inner]) => `${key}: ${describe(inner)}`)
      .join(', ')} }`;
  }
  return String(value);
}

/**
 * @param {object} evalCase  A case from cases.js.
 * @param {object} result    The agent result ({ kind, reply, draft?, data? }).
 * @param {'llm'|'rules'} mode
 * @returns {{ id: string, requirement: string, pass: boolean, checks: object[] }}
 */
export function scoreCase(evalCase, result, mode) {
  const expect = evalCase.expect || {};
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  if (expect.kind) {
    add('kind', result.kind === expect.kind, `expected kind "${expect.kind}", got "${result.kind}"`);
  }

  const toolCalls = result?.data?.toolCalls;

  if (mode === 'llm' && expect.tools) {
    const names = Array.isArray(toolCalls) ? toolCalls.map((call) => call.name) : [];
    const toolOk = names.some((name) => expect.tools.includes(name));
    add(
      'tool',
      toolOk,
      `expected tool in [${expect.tools.join(', ')}], got [${names.join(', ') || 'none'}]`
    );
    if (expect.toolArgs) {
      add(
        'toolArgs',
        findToolCall(toolCalls, expect.tools, expect.toolArgs),
        `expected ${expect.tools.join('/')} args ${describe(expect.toolArgs)}`
      );
    }
  }

  if (mode === 'rules' && expect.intents) {
    const intent = result?.data?.intent;
    add(
      'intent',
      expect.intents.includes(intent),
      `expected intent in [${expect.intents.join(', ')}], got "${intent}"`
    );
  }

  if (expect.draft) {
    const draft = result.draft || {};
    for (const [key, value] of Object.entries(expect.draft)) {
      add(
        `draft.${key}`,
        matchValue(draft[key], value),
        `expected draft.${key}=${value}, got ${draft[key]}`
      );
    }
  }

  if (expect.replyMatches) {
    add(
      'replyMatches',
      new RegExp(expect.replyMatches, 'i').test(result.reply || ''),
      `reply did not match /${expect.replyMatches}/i -> "${result.reply}"`
    );
  }
  if (expect.replyContains) {
    for (const text of [].concat(expect.replyContains)) {
      add(`reply~${text}`, (result.reply || '').includes(text), `reply missing "${text}"`);
    }
  }
  if (expect.replyExcludes) {
    for (const text of [].concat(expect.replyExcludes)) {
      add(`reply!~${text}`, !(result.reply || '').includes(text), `reply unexpectedly had "${text}"`);
    }
  }

  return {
    id: evalCase.id,
    requirement: evalCase.requirement,
    pass: checks.every((check) => check.ok),
    checks,
  };
}

export default { scoreCase };

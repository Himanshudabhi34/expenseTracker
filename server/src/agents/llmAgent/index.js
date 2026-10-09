import config from '../../config/env.js';
import { isOllamaAvailable, ollamaChat } from './ollamaClient.js';
import { TOOL_DEFINITIONS, executeTool, parseToolArguments } from './tools.js';

export function buildSystemPrompt({ currency, timeZone, now }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
  return [
    'You are "Expense Agent", a friendly assistant inside a personal expense-tracking app.',
    `The user's currency is ${currency} and their timezone is ${timeZone}. Today is ${today}.`,
    '',
    'Rules:',
    '- Always call tools to fetch the user\'s real data. Never invent, guess or estimate numbers.',
    '- For questions about spending, income, categories, budgets, comparisons or goals, call the relevant tool first, then answer concisely using its result.',
    '- If the tool reports no data, say so plainly.',
    '- To record a transaction, call draft_transaction. Do NOT say it is saved; the user must confirm afterwards. Then briefly ask them to confirm.',
    '- Keep replies short, friendly and in the user\'s currency.',
    '- Only use the provided tools; never make up tool names.',
  ].join('\n');
}

function extractToolCalls(message) {
  if (!message) return [];
  const calls = message.tool_calls || message.toolCalls || [];
  return Array.isArray(calls) ? calls : [];
}

/**
 * Runs the LLM tool-calling loop. Throws when the model is unreachable or
 * returns nothing usable, so the caller can fall back to the rule-based agent.
 */
export async function handleLlmAgentMessage({
  userId,
  message,
  timeZone = 'UTC',
  currency = 'INR',
  now = new Date(),
  history = [],
} = {}) {
  if (!(await isOllamaAvailable())) {
    throw new Error('LLM provider unavailable');
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt({ currency, timeZone, now }) },
    ...(Array.isArray(history) ? history.slice(-8) : []),
    { role: 'user', content: message },
  ];

  const usedToolCalls = [];

  for (let turn = 0; turn < config.llmMaxTurns; turn += 1) {
    const response = await ollamaChat({ messages, tools: TOOL_DEFINITIONS });
    const assistant = response?.message || {};
    messages.push(assistant);

    const calls = extractToolCalls(assistant);

    if (calls.length === 0) {
      const reply = (assistant.content || '').trim();
      if (!reply) throw new Error('Empty LLM reply');
      return { kind: 'answer', reply, data: { source: 'llm', toolCalls: usedToolCalls } };
    }

    for (const call of calls) {
      const name = call.function?.name;
      const args = parseToolArguments(call.function?.arguments);
      usedToolCalls.push({ name, args });

      const { result, draft, reply } = await executeTool(name, args, {
        userId,
        timeZone,
        currency,
        now,
      });

      if (draft) {
        // Transactions are always confirmed by the user before saving.
        return { kind: 'draft', reply, draft, data: { source: 'llm', toolCalls: usedToolCalls } };
      }

      messages.push({ role: 'tool', content: JSON.stringify(result) });
    }
  }

  throw new Error('LLM did not finish within the allowed turns');
}

export default { handleLlmAgentMessage, buildSystemPrompt };

import config from '../config/env.js';
import { handleAgentMessage as handleRuleBased } from './expenseAgent/index.js';
import { handleLlmAgentMessage } from './llmAgent/index.js';

/**
 * Picks the best available agent engine.
 *
 * - Confirming a draft always uses the deterministic rule-based save path.
 * - Otherwise the LLM (Ollama) agent is tried when enabled; if it is disabled,
 *   unreachable or errors, we transparently fall back to the rule-based engine.
 */
export async function handleAgentMessage(params = {}) {
  const { confirm, draft, useLlm = true } = params;

  if (confirm && draft) {
    return handleRuleBased(params);
  }

  if (useLlm && config.llmEnabled && config.llmProvider === 'ollama') {
    try {
      const result = await handleLlmAgentMessage(params);
      if (result && result.reply) return result;
    } catch {
      // Fall through to the deterministic agent.
    }
  }

  return handleRuleBased(params);
}

export default { handleAgentMessage };

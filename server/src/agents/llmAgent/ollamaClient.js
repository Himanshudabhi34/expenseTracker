import config from '../../config/env.js';

let availabilityCache = { at: 0, ok: false };
const AVAILABILITY_TTL_MS = 10000;

/**
 * Lightweight probe so callers can skip the LLM and fall back quickly when
 * Ollama is not installed or not running. Result is cached briefly.
 */
export async function isOllamaAvailable({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - availabilityCache.at < AVAILABILITY_TTL_MS) {
    return availabilityCache.ok;
  }

  let ok = false;
  try {
    const res = await fetch(`${config.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    });
    ok = res.ok;
  } catch {
    ok = false;
  }

  availabilityCache = { at: now, ok };
  return ok;
}

/**
 * Sends a chat request (non-streaming) to Ollama's /api/chat with tools.
 */
export async function ollamaChat({ messages, tools }) {
  const res = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      messages,
      tools,
      stream: false,
      options: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(config.llmTimeoutMs),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama chat failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

export default { isOllamaAvailable, ollamaChat };

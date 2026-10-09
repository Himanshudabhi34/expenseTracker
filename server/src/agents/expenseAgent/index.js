import { parseExpenseEntry } from './parser.js';
import { suggestCategoryName } from './categorizer.js';
import { detectIntent, INTENTS } from './intentDetector.js';
import { executeIntent } from './queryExecutor.js';
import { buildAnswer, buildEntryDraft, buildSavedResponse } from './responseBuilder.js';
import { listCategories, getFallbackCategory } from '../../services/category.service.js';
import { createTransaction } from '../../services/transaction.service.js';

async function resolveCategoryDoc(userId, name) {
  const categories = await listCategories(userId);
  const lower = name.toLowerCase();
  const match =
    categories.find((c) => c.name.toLowerCase() === lower) ||
    categories.find((c) => c.name.toLowerCase().includes(lower));
  if (match) return match;
  const fallback = await getFallbackCategory('expense');
  return fallback ? { id: fallback._id, name: fallback.name } : null;
}

/**
 * Main entry point for the Expense Agent.
 * @returns {Promise<{ kind: 'draft'|'saved'|'answer', reply: string, draft?: object, data?: object }>}
 */
export async function handleAgentMessage({
  userId,
  message,
  timeZone = 'UTC',
  currency = 'INR',
  confirm = false,
  draft = null,
  now = new Date(),
} = {}) {
  // 1. Confirmation of a previously parsed draft.
  if (confirm && draft) {
    let categoryId = draft.categoryId;
    if (!categoryId) {
      const cat = await getFallbackCategory(draft.type);
      categoryId = cat?._id;
    }
    const transactionDate = draft.transactionDate ? new Date(draft.transactionDate) : now;
    const saved = await createTransaction(userId, {
      type: draft.type,
      amount: draft.amount,
      categoryId,
      description: draft.description || 'Transaction',
      transactionDate,
      paymentMethod: draft.paymentMethod || 'other',
      notes: draft.notes || '',
    });
    return {
      kind: 'saved',
      reply: buildSavedResponse(saved, { currency }),
      data: { transaction: saved },
    };
  }

  const { kind, intent, entities } = detectIntent(message);

  // 2. Natural-language entry -> return a draft for confirmation.
  if (kind === 'entry' || intent === INTENTS.ENTRY) {
    const parsed = parseExpenseEntry(message, { now, timeZone });
    const suggestion = suggestCategoryName(message, { type: parsed.type });
    const categoryDoc = await resolveCategoryDoc(userId, suggestion.name);
    const category = categoryDoc
      ? {
          id: categoryDoc.id || categoryDoc._id,
          name: categoryDoc.name,
          confidence: suggestion.confidence,
        }
      : { id: null, name: 'Other', confidence: 'low' };

    const built = buildEntryDraft(parsed, category, { currency });
    return { kind: 'draft', reply: built.reply, draft: built.draft };
  }

  // 3. Question -> query the database and answer.
  if (kind === 'question') {
    const result = await executeIntent(intent, entities, { userId, timeZone, now });
    const built = buildAnswer(result, { currency });
    return { kind: 'answer', reply: built.reply, data: built.data };
  }

  // 4. Unknown.
  const built = buildAnswer({ intent: 'unknown' }, { currency });
  return { kind: 'answer', reply: built.reply, data: { intent: 'unknown' } };
}

export { INTENTS, parseExpenseEntry, suggestCategoryName, detectIntent };

export default { handleAgentMessage };

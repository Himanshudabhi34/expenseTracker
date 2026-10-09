import { z } from 'zod';

export const agentMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(500),
  timezone: z.string().trim().max(64).optional(),
  // Per-request engine choice: true -> LLM (Ollama) agent, false -> deterministic
  // rule-based agent. Defaults to the LLM agent.
  useLlm: z.boolean().optional().default(true),
  // Prior turns, so the LLM can keep conversational context.
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(20)
    .optional()
    .default([]),
  // When the user confirms a previously parsed draft, they can post the
  // structured transaction back with `confirm: true`.
  confirm: z.boolean().optional().default(false),
  draft: z
    .object({
      type: z.enum(['expense', 'income']),
      amount: z.coerce.number().positive(),
      categoryId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      description: z.string().trim().min(1).max(200),
      transactionDate: z.coerce.date(),
      paymentMethod: z
        .enum(['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer', 'other'])
        .optional(),
      notes: z.string().trim().max(500).optional(),
    })
    .optional(),
});

export default { agentMessageSchema };

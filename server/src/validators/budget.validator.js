import { z } from 'zod';
import { BUDGET_PERIOD_VALUES } from '../config/constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const amountMajor = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n) && n > 0, 'Amount must be greater than zero');

export const createBudgetSchema = z.object({
  name: z.string().trim().min(1).max(80).optional().default('Monthly Budget'),
  period: z.enum(BUDGET_PERIOD_VALUES).optional().default('monthly'),
  amount: amountMajor,
  categoryId: objectId.nullish(),
  warningThresholds: z.array(z.coerce.number().gt(0).lte(100)).min(1).max(5).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export default { createBudgetSchema, updateBudgetSchema };

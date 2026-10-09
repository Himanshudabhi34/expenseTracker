import { z } from 'zod';
import { GOAL_STATUS_VALUES } from '../config/constants.js';

const amountMajor = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n) && n >= 0, 'Amount must be zero or greater');

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(120),
  targetAmount: amountMajor.refine((n) => n > 0, 'Target amount must be greater than zero'),
  currentAmount: amountMajor.optional().default(0),
  targetDate: z.coerce.date().nullish(),
  status: z.enum(GOAL_STATUS_VALUES).optional().default('active'),
});

export const updateGoalSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  targetAmount: amountMajor
    .refine((n) => n > 0, 'Target amount must be greater than zero')
    .optional(),
  currentAmount: amountMajor.optional(),
  contribution: z.coerce
    .number()
    .refine((n) => n !== 0, 'Contribution cannot be zero')
    .optional(),
  targetDate: z.coerce.date().nullish(),
  status: z.enum(GOAL_STATUS_VALUES).optional(),
});

export default { createGoalSchema, updateGoalSchema };

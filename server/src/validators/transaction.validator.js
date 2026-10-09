import { z } from 'zod';
import { TRANSACTION_TYPE_VALUES, PAYMENT_METHOD_VALUES } from '../config/constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const amountMajor = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n) && n > 0, 'Amount must be greater than zero');

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPE_VALUES),
  amount: amountMajor,
  categoryId: objectId,
  description: z.string().trim().min(1, 'Description is required').max(200),
  merchant: z.string().trim().max(120).optional().default(''),
  transactionDate: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional().default('other'),
  notes: z.string().trim().max(500).optional().default(''),
  currency: z.string().trim().length(3).toUpperCase().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(TRANSACTION_TYPE_VALUES).optional(),
  categoryId: objectId.optional(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  minAmount: amountMajor.optional(),
  maxAmount: amountMajor.optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).optional(),
});

export default {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
};

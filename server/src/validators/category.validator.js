import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60),
  type: z.enum(['expense', 'income', 'both']).optional().default('expense'),
  iconKey: z.string().trim().max(40).optional().default('tag'),
});

export default { createCategorySchema };

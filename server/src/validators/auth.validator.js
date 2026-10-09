import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine((data) => !(data.newPassword && !data.currentPassword), {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  });

export default { registerSchema, loginSchema, updateProfileSchema };

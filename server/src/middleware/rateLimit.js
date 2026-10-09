import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const skip = () => config.isTest;

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, error: { message: 'Too many attempts. Please try again later.' } },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { success: false, error: { message: 'Too many requests. Please slow down.' } },
});

export default { authLimiter, apiLimiter };

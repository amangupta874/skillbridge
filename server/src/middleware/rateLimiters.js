import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const tooManyRequests = (req, res) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } });

// Use on POST /api/auth/login and POST /api/auth/register only.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
  skip: () => env.NODE_ENV === 'test',
});

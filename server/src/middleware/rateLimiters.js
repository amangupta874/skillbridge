import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const tooManyRequests = (req, res) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } });

// Use on POST /api/auth/login and POST /api/auth/register only.
export function createAuthLimiter({ windowMs = 15 * 60 * 1000, limit = 30, skip = () => env.NODE_ENV === 'test' } = {}) {
  return rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, handler: tooManyRequests, skip });
}

export const authLimiter = createAuthLimiter();

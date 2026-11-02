import dotenv from 'dotenv';
import { z } from 'zod';

// Tests load .env.test, everything else loads .env (run commands from the server/ folder).
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.url(),                      // exact URL of the frontend, e.g. http://localhost:5173
  SESSION_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  console.error('Invalid environment configuration:\n  ' + problems.join('\n  '));
  process.exit(1);
}

export const env = parsed.data;

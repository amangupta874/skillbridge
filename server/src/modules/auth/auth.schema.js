import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(80),
    email: z.email(),
    password: z.string().min(8).max(72)
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a digit'),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});


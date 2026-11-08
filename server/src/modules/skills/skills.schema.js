import { z } from 'zod';

export const searchSkillsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    query: z.string().trim().max(50).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
  params: z.object({}).optional(),
});

import { z } from 'zod';

export const projectMatchesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }),
});

import { z } from 'zod';

export const lookupsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}),
  params: z.object({}).optional(),
});

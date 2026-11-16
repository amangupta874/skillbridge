import { z } from 'zod';

export const applicationSchema = z.object({
  message: z.string().trim().min(10, 'Use at least 10 characters').max(500, 'Use 500 characters or fewer'),
});

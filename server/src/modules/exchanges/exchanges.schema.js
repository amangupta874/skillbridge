import { z } from 'zod';

const exchangeStatus = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED']);
const pageQuery = {
  status: exchangeStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

export const createExchangeSchema = z.object({
  body: z.object({
    recipientId: z.string().uuid(),
    offeredSkillId: z.number().int().positive(),
    requestedSkillId: z.number().int().positive(),
    message: z.string().trim().min(10).max(500),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listExchangesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    ...pageQuery,
    box: z.enum(['incoming', 'outgoing', 'all']).default('all'),
  }),
});

export const updateExchangeSchema = z.object({
  body: z.object({ status: exchangeStatus }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

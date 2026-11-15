import { z } from 'zod';

const applicationStatus = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']);
const pageQuery = {
  status: applicationStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

export const createApplicationSchema = z.object({
  body: z.object({ message: z.string().trim().min(10).max(500) }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listProjectApplicationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object(pageQuery),
});

export const listMyApplicationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object(pageQuery),
});

export const updateApplicationSchema = z.object({
  body: z.object({ status: z.literal('WITHDRAWN') }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

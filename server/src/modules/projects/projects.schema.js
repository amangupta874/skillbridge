import { z } from 'zod';

const level = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const projectStatus = z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']);
const futureDate = z.iso.datetime().refine((value) => new Date(value) > new Date(), 'Deadline must be in the future');
const httpsUrl = z.url().refine((value) => value.startsWith('https://'), 'URL must use https');
const projectFields = {
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(2000),
  categoryId: z.coerce.number().int().positive(),
  difficulty: level,
  maxTeamSize: z.number().int().min(2).max(10),
  hoursPerWeek: z.number().int().min(1).max(60).nullable(),
  deadline: futureDate.nullable(),
  githubUrl: httpsUrl.nullable(),
  demoUrl: httpsUrl.nullable(),
  skills: z.array(z.object({ skillId: z.number().int().positive(), minLevel: level })).min(1).max(10),
};

export const createProjectSchema = z.object({
  body: z.object({
    ...projectFields,
    hoursPerWeek: projectFields.hoursPerWeek.optional(),
    deadline: projectFields.deadline.optional(),
    githubUrl: projectFields.githubUrl.optional(),
    demoUrl: projectFields.demoUrl.optional(),
    status: z.enum(['DRAFT', 'OPEN']).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProjectSchema = z.object({
  body: z.object({
    ...Object.fromEntries(Object.entries(projectFields).map(([key, value]) => [key, value.optional()])),
    status: projectStatus.optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const projectIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listProjectsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    query: z.string().trim().max(100).optional(),
    skillIds: z.string().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    difficulty: level.optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']).optional(),
    hasOpenSeats: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    mine: z.enum(['owned', 'member']).optional(),
    sort: z.enum(['newest', 'oldest', 'seats']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }).superRefine((query, context) => {
    if (query.skillIds === undefined || query.skillIds === '') return;
    const skillIds = query.skillIds.split(',');
    if (skillIds.some((id) => !/^\d+$/.test(id) || Number(id) < 1)) {
      context.addIssue({ code: 'custom', path: ['skillIds'], message: 'skillIds must be a comma separated list of positive integers' });
    }
  }),
});

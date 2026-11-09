import { z } from 'zod';

const emptyInput = z.object({}).optional();

const linkSchema = z.object({
  type: z.enum(['GITHUB', 'LINKEDIN', 'PORTFOLIO', 'OTHER']),
  url: z.url().refine((url) => url.startsWith('https://'), 'URL must use HTTPS'),
});

export const userIdSchema = z.object({
  body: emptyInput,
  query: z.object({}),
  params: z.object({ id: z.uuid() }),
});

export const listUsersSchema = z.object({
  body: emptyInput,
  query: z.object({
    query: z.string().trim().max(100).optional(),
    skillId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
  params: z.object({}),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(80).optional(),
    bio: z.string().max(500).nullable().optional(),
    weeklyHours: z.number().int().min(1).max(80).nullable().optional(),
    collegeId: z.number().int().positive().nullable().optional(),
    links: z.array(linkSchema).max(4).optional()
      .refine((links) => !links || new Set(links.map((link) => link.type)).size === links.length, 'Link types must be unique'),
    interestIds: z.array(z.number().int().positive()).max(10).optional()
      .refine((ids) => !ids || new Set(ids).size === ids.length, 'Interest ids must be unique'),
  }).refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
  query: z.object({}),
  params: z.object({}),
});

export const updateSkillsSchema = z.object({
  body: z.object({
    skills: z.array(z.object({
      skillId: z.number().int().positive(),
      level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    })).max(30).refine((skills) => new Set(skills.map((skill) => skill.skillId)).size === skills.length, 'Skill ids must be unique'),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const updateLearningGoalsSchema = z.object({
  body: z.object({
    skillIds: z.array(z.number().int().positive()).max(15)
      .refine((skillIds) => new Set(skillIds).size === skillIds.length, 'Skill ids must be unique'),
  }),
  query: z.object({}),
  params: z.object({}),
});

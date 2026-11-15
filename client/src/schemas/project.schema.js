import { z } from 'zod';

const projectLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const optionalHttpsUrl = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.url().refine((value) => value.startsWith('https://'), 'Use an https URL').optional(),
);

const optionalHours = z.preprocess(
  (value) => value === '' || value === undefined || Number.isNaN(value) ? undefined : Number(value),
  z.number().int().min(1).max(60).optional(),
);

export const projectFormSchema = z.object({
  title: z.string().trim().min(5, 'Use at least 5 characters').max(100, 'Use 100 characters or fewer'),
  description: z.string().trim().min(20, 'Use at least 20 characters').max(2000, 'Use 2000 characters or fewer'),
  categoryId: z.coerce.number().int().positive('Choose a category'),
  difficulty: z.enum(projectLevels),
  maxTeamSize: z.coerce.number().int().min(2).max(10),
  hoursPerWeek: optionalHours,
  deadline: z.string().refine((value) => !value || new Date(value).getTime() > Date.now(), 'Choose a future date').optional(),
  githubUrl: optionalHttpsUrl,
  demoUrl: optionalHttpsUrl,
  skills: z.array(z.object({
    skill: z.object({ id: z.number().int().positive() }),
    level: z.enum(projectLevels),
  })).min(1, 'Add at least one required skill').max(10, 'Choose no more than 10 skills'),
});

export const projectFormDefaults = {
  title: '',
  description: '',
  categoryId: '',
  difficulty: 'BEGINNER',
  maxTeamSize: 2,
  hoursPerWeek: '',
  deadline: '',
  githubUrl: '',
  demoUrl: '',
  skills: [],
};

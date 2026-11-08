import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { prisma } from '../../config/prisma.js';
import { app } from '../../app.js';
import { createProjectCategory, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/lookups', () => {
  test('returns the four lookup lists', async () => {
    await createProjectCategory('Web');
    await prisma.skillCategory.create({ data: { name: 'Programming' } });
    await prisma.interest.create({ data: { name: 'Design' } });
    await prisma.college.create({ data: { name: 'Other' } });
    const { agent } = await registerUser();

    const response = await agent.get('/api/lookups');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      projectCategories: [{ id: expect.any(Number), name: 'Web' }],
      skillCategories: [{ id: expect.any(Number), name: 'Programming' }],
      interests: [{ id: expect.any(Number), name: 'Design' }],
      colleges: [{ id: expect.any(Number), name: 'Other' }],
    });
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/lookups');

    expect(response.status).toBe(401);
  });

  test('returns empty lookup lists when the tables are empty', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/lookups');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      projectCategories: [],
      skillCategories: [],
      interests: [],
      colleges: [],
    });
  });
});

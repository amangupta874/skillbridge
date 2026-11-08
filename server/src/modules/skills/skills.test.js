import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { prisma } from '../../config/prisma.js';
import { app } from '../../app.js';
import { createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/skills', () => {
  test('searches skill names and aliases and returns the category', async () => {
    const javaScript = await createSkill('JavaScript', 'Programming');
    await createSkill('Java', 'Programming');
    await prisma.skillAlias.create({ data: { alias: 'js', skillId: javaScript.id } });
    const { agent } = await registerUser();

    const response = await agent.get('/api/skills?query=JS');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{
      id: javaScript.id,
      name: 'JavaScript',
      category: { id: expect.any(Number), name: 'Programming' },
    }]);
  });

  test('rejects an invalid limit', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/skills?limit=101');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/skills');

    expect(response.status).toBe(401);
  });

  test('returns an empty list when no skills match', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/skills?query=unknown');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});

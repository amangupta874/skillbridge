import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import { createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/users/:id', () => {
  test('returns a public profile without an email', async () => {
    const { agent, user } = await registerUser({ email: 'profile-user@test.com' });

    const response = await agent.get(`/api/users/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: user.id,
      fullName: user.fullName,
      college: null,
      links: [],
      skills: [],
      learningGoals: [],
      interests: [],
    });
    expect(response.body.data).not.toHaveProperty('email');
  });

  test('rejects an invalid user id', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/users/not-a-uuid');

    expect(response.status).toBe(400);
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/users/00000000-0000-4000-8000-000000000000');

    expect(response.status).toBe(401);
  });

  test('returns 404 for an unknown user', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/users/00000000-0000-4000-8000-000000000000');

    expect(response.status).toBe(404);
  });
});

describe('GET /api/users', () => {
  test('filters by name and skill and excludes the caller', async () => {
    const { agent, user: caller } = await registerUser({ fullName: 'Caller User' });
    const { user: teammate } = await registerUser({ fullName: 'Taylor Teammate' });
    const { user: other } = await registerUser({ fullName: 'Morgan Other' });
    const skill = await createSkill('Python');
    await prisma.userSkill.create({ data: { userId: teammate.id, skillId: skill.id, level: 'ADVANCED' } });

    const response = await agent.get(`/api/users?query=taylor&skillId=${skill.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: teammate.id,
      fullName: 'Taylor Teammate',
      topSkills: [{ skill: { id: skill.id, name: 'Python' }, level: 'ADVANCED' }],
    });
    expect(response.body.data.map((user) => user.id)).not.toContain(other.id);
    expect(response.body.data.map((user) => user.id)).not.toContain(caller.id);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 12, total: 1, totalPages: 1 });
  });

  test('rejects invalid pagination values', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/users?page=0&limit=51');

    expect(response.status).toBe(400);
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });

  test('returns an empty page when no users match', async () => {
    const { agent } = await registerUser();

    const response = await agent.get('/api/users?query=nobody');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });
});

describe('PATCH /api/users/me', () => {
  test('updates profile fields and replaces links and interests', async () => {
    const { agent, user } = await registerUser();
    const college = await prisma.college.create({ data: { name: 'Test College' } });
    const interest = await prisma.interest.create({ data: { name: 'Robotics' } });
    const oldInterest = await prisma.interest.create({ data: { name: 'Music' } });
    await prisma.userLink.create({ data: { userId: user.id, type: 'OTHER', url: 'https://old.example.com' } });
    await prisma.userInterest.create({ data: { userId: user.id, interestId: oldInterest.id } });

    const response = await agent.patch('/api/users/me').send({
      fullName: 'Updated User',
      bio: 'I build small robots.',
      weeklyHours: 8,
      collegeId: college.id,
      links: [{ type: 'GITHUB', url: 'https://github.com/test-user' }],
      interestIds: [interest.id],
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: user.id,
      fullName: 'Updated User',
      bio: 'I build small robots.',
      weeklyHours: 8,
      college: { id: college.id, name: 'Test College' },
      links: [{ type: 'GITHUB', url: 'https://github.com/test-user' }],
      interests: [{ id: interest.id, name: 'Robotics' }],
    });
    expect(response.body.data).not.toHaveProperty('email');
  });

  test('rejects an invalid profile field', async () => {
    const { agent } = await registerUser();

    const response = await agent.patch('/api/users/me').send({ weeklyHours: 0 });

    expect(response.status).toBe(400);
  });

  test('requires a session', async () => {
    const response = await request(app).patch('/api/users/me').send({ fullName: 'Changed Name' });

    expect(response.status).toBe(401);
  });

  test('rejects a college id that does not exist', async () => {
    const { agent } = await registerUser();

    const response = await agent.patch('/api/users/me').send({ collegeId: 9876 });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/users/me/skills', () => {
  test('replaces the known skills', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('JavaScript');

    const response = await agent.put('/api/users/me/skills').send({
      skills: [{ skillId: skill.id, level: 'INTERMEDIATE' }],
    });

    expect(response.status).toBe(200);
    expect(response.body.data.skills).toMatchObject([{
      skill: { id: skill.id, name: 'JavaScript', category: { name: 'Test Category' } },
      level: 'INTERMEDIATE',
    }]);
  });

  test('rejects a duplicate skill id', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('JavaScript');

    const response = await agent.put('/api/users/me/skills').send({
      skills: [
        { skillId: skill.id, level: 'BEGINNER' },
        { skillId: skill.id, level: 'ADVANCED' },
      ],
    });

    expect(response.status).toBe(400);
  });

  test('requires a session', async () => {
    const response = await request(app).put('/api/users/me/skills').send({ skills: [] });

    expect(response.status).toBe(401);
  });

  test('rejects an unknown skill id', async () => {
    const { agent } = await registerUser();

    const response = await agent.put('/api/users/me/skills').send({
      skills: [{ skillId: 9876, level: 'BEGINNER' }],
    });

    expect(response.status).toBe(400);
  });

  test('rejects a skill that is already a learning goal', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('JavaScript');
    await agent.put('/api/users/me/learning-goals').send({ skillIds: [skill.id] });

    const response = await agent.put('/api/users/me/skills').send({
      skills: [{ skillId: skill.id, level: 'BEGINNER' }],
    });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/users/me/learning-goals', () => {
  test('replaces the learning goals', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('Rust');

    const response = await agent.put('/api/users/me/learning-goals').send({ skillIds: [skill.id] });

    expect(response.status).toBe(200);
    expect(response.body.data.learningGoals).toEqual([{ id: skill.id, name: 'Rust' }]);
  });

  test('rejects duplicate learning goal ids', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('Rust');

    const response = await agent.put('/api/users/me/learning-goals').send({ skillIds: [skill.id, skill.id] });

    expect(response.status).toBe(400);
  });

  test('requires a session', async () => {
    const response = await request(app).put('/api/users/me/learning-goals').send({ skillIds: [] });

    expect(response.status).toBe(401);
  });

  test('rejects an unknown learning goal id', async () => {
    const { agent } = await registerUser();

    const response = await agent.put('/api/users/me/learning-goals').send({ skillIds: [9876] });

    expect(response.status).toBe(400);
  });

  test('rejects a learning goal that is already a known skill', async () => {
    const { agent } = await registerUser();
    const skill = await createSkill('Rust');
    await agent.put('/api/users/me/skills').send({ skills: [{ skillId: skill.id, level: 'BEGINNER' }] });

    const response = await agent.put('/api/users/me/learning-goals').send({ skillIds: [skill.id] });

    expect(response.status).toBe(400);
  });
});

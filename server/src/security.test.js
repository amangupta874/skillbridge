import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { prisma } from './config/prisma.js';
import { createProjectCategory, createSkill, registerUser, resetDatabase } from '../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const protectedRoutes = [
  ['POST', '/api/auth/logout'],
  ['GET', '/api/auth/me'],
  ['GET', '/api/lookups'],
  ['GET', '/api/skills'],
  ['GET', '/api/users'],
  ['GET', '/api/users/00000000-0000-4000-8000-000000000000'],
  ['PATCH', '/api/users/me'],
  ['PUT', '/api/users/me/skills'],
  ['PUT', '/api/users/me/learning-goals'],
  ['GET', '/api/users/me/applications'],
  ['GET', '/api/projects'],
  ['POST', '/api/projects'],
  ['GET', '/api/projects/00000000-0000-4000-8000-000000000000'],
  ['PATCH', '/api/projects/00000000-0000-4000-8000-000000000000'],
  ['GET', '/api/projects/00000000-0000-4000-8000-000000000000/matches'],
  ['POST', '/api/projects/00000000-0000-4000-8000-000000000000/applications'],
  ['GET', '/api/projects/00000000-0000-4000-8000-000000000000/applications'],
  ['PATCH', '/api/applications/00000000-0000-4000-8000-000000000000'],
  ['POST', '/api/exchanges'],
  ['GET', '/api/exchanges'],
  ['PATCH', '/api/exchanges/00000000-0000-4000-8000-000000000000'],
  ['GET', '/api/notifications'],
  ['GET', '/api/notifications/unread-count'],
  ['PATCH', '/api/notifications/read-all'],
  ['PATCH', '/api/notifications/00000000-0000-4000-8000-000000000000/read'],
];

async function send(agent, method, path, body) {
  let call = agent[method.toLowerCase()](path);
  if (body !== undefined) call = call.send(body);
  return call;
}

const unknownId = '00000000-0000-4000-8000-000000000000';
const idRoutes = [
  ['GET', '/api/users/:id', (id) => `/api/users/${id}`],
  ['GET', '/api/projects/:id', (id) => `/api/projects/${id}`],
  ['PATCH', '/api/projects/:id', (id) => `/api/projects/${id}`, { title: 'Updated project title' }],
  ['GET', '/api/projects/:id/matches', (id) => `/api/projects/${id}/matches`],
  ['POST', '/api/projects/:id/applications', (id) => `/api/projects/${id}/applications`, { message: 'I would like to apply.' }],
  ['GET', '/api/projects/:id/applications', (id) => `/api/projects/${id}/applications`],
  ['PATCH', '/api/applications/:id', (id) => `/api/applications/${id}`, { status: 'ACCEPTED' }],
  ['PATCH', '/api/exchanges/:id', (id) => `/api/exchanges/${id}`, { status: 'ACCEPTED' }],
  ['PATCH', '/api/notifications/:id/read', (id) => `/api/notifications/${id}/read`],
];

function expectNoSensitiveKeys(value) {
  if (Array.isArray(value)) {
    for (const child of value) expectNoSensitiveKeys(child);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      expect(['email', 'passwordHash', 'password']).not.toContain(key);
      expectNoSensitiveKeys(child);
    }
  }
}

async function safeResponse(response, expectedStatus = 200) {
  expect(response.status).toBe(expectedStatus);
  expectNoSensitiveKeys(response.body);
  return response.body.data;
}

describe('API route security', () => {
  test.each(protectedRoutes)('%s %s requires a session', async (method, path) => {
    const response = await send(request(app), method, path);
    expect(response.status).toBe(401);
  });

  test.each(idRoutes)('%s %s rejects an unknown id and a malformed id', async (method, _label, pathFor, body) => {
    const { agent } = await registerUser();
    const unknown = await send(agent, method, pathFor(unknownId), body);
    expect(unknown.status).toBe(404);

    const malformed = await send(agent, method, pathFor('not-a-uuid'), body);
    expect(malformed.status).toBe(400);
  });

  test('ownership routes hide or forbid another user', async () => {
    const owner = await registerUser({ fullName: 'Route Owner' });
    const applicant = await registerUser({ fullName: 'Route Applicant' });
    const stranger = await registerUser({ fullName: 'Route Stranger' });
    const category = await createProjectCategory();
    const projectSkill = await createSkill('Hardening project skill');
    const projectResponse = await owner.agent.post('/api/projects').send({
      title: 'Hardening test project',
      description: 'A project used to check route authorization behaviour.',
      categoryId: category.id,
      difficulty: 'BEGINNER',
      maxTeamSize: 4,
      skills: [{ skillId: projectSkill.id, minLevel: 'BEGINNER' }],
      status: 'OPEN',
    });
    expect(projectResponse.status).toBe(201);
    const projectId = projectResponse.body.data.id;
    const applicationResponse = await applicant.agent.post(`/api/projects/${projectId}/applications`).send({
      message: 'I would like to work on this project.',
    });
    expect(applicationResponse.status).toBe(201);
    const applicationId = applicationResponse.body.data.id;

    const offered = await createSkill('Hardening offer');
    const requested = await createSkill('Hardening request');
    await prisma.userSkill.createMany({ data: [
      { userId: owner.user.id, skillId: offered.id, level: 'INTERMEDIATE' },
      { userId: applicant.user.id, skillId: requested.id, level: 'BEGINNER' },
    ] });
    const exchangeResponse = await owner.agent.post('/api/exchanges').send({
      recipientId: applicant.user.id,
      offeredSkillId: offered.id,
      requestedSkillId: requested.id,
      message: 'I would like to swap these skills.',
    });
    expect(exchangeResponse.status).toBe(201);
    const notification = await prisma.notification.findFirst({ where: { applicationId } });

    expect((await stranger.agent.patch(`/api/projects/${projectId}`).send({ title: 'Changed project title' })).status).toBe(403);
    expect((await stranger.agent.get(`/api/projects/${projectId}/applications`)).status).toBe(403);
    expect((await stranger.agent.patch(`/api/applications/${applicationId}`).send({ status: 'ACCEPTED' })).status).toBe(403);
    expect((await stranger.agent.get(`/api/projects/${projectId}/matches`)).status).toBe(403);
    expect((await stranger.agent.patch(`/api/exchanges/${exchangeResponse.body.data.id}`).send({ status: 'ACCEPTED' })).status).toBe(404);
    expect((await stranger.agent.patch(`/api/notifications/${notification.id}/read`)).status).toBe(404);
  });

  test('module responses never include emails, password hashes, or passwords', async () => {
    const owner = await registerUser({ fullName: 'Privacy Owner' });
    const applicant = await registerUser({ fullName: 'Privacy Applicant' });
    const category = await createProjectCategory();
    const required = await createSkill('Privacy required skill');
    const offered = await createSkill('Privacy offered skill');
    const requested = await createSkill('Privacy requested skill');
    const goal = await createSkill('Privacy goal skill');
    await safeResponse(await owner.agent.put('/api/users/me/skills').send({ skills: [
      { skillId: offered.id, level: 'ADVANCED' }, { skillId: required.id, level: 'INTERMEDIATE' },
    ] }));
    await safeResponse(await owner.agent.put('/api/users/me/learning-goals').send({ skillIds: [goal.id] }));
    await safeResponse(await applicant.agent.put('/api/users/me/skills').send({ skills: [
      { skillId: requested.id, level: 'BEGINNER' }, { skillId: required.id, level: 'ADVANCED' },
    ] }));
    await safeResponse(await owner.agent.get('/api/users'));
    await safeResponse(await owner.agent.get(`/api/users/${applicant.user.id}`));
    await safeResponse(await owner.agent.patch('/api/users/me').send({ bio: 'A private profile response.' }));

    const projectResponse = await owner.agent.post('/api/projects').send({
      title: 'Privacy test project',
      description: 'A project used to check responses for private account fields.',
      categoryId: category.id,
      difficulty: 'BEGINNER',
      maxTeamSize: 4,
      skills: [{ skillId: required.id, minLevel: 'BEGINNER' }],
      status: 'OPEN',
    });
    const project = await safeResponse(projectResponse, 201);
    await safeResponse(await owner.agent.get('/api/projects'));
    await safeResponse(await owner.agent.get(`/api/projects/${project.id}`));
    await safeResponse(await owner.agent.patch(`/api/projects/${project.id}`).send({ title: 'Updated privacy project' }));
    await safeResponse(await owner.agent.get(`/api/projects/${project.id}/matches`));

    const applicationResponse = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({
      message: 'I would like to work on this project.',
    });
    const application = await safeResponse(applicationResponse, 201);
    await safeResponse(await owner.agent.get(`/api/projects/${project.id}/applications`));
    await safeResponse(await applicant.agent.get('/api/users/me/applications'));
    await safeResponse(await applicant.agent.patch(`/api/applications/${application.id}`).send({ status: 'WITHDRAWN' }));

    const exchangeResponse = await owner.agent.post('/api/exchanges').send({
      recipientId: applicant.user.id,
      offeredSkillId: offered.id,
      requestedSkillId: requested.id,
      message: 'I would like to swap these skills.',
    });
    const exchange = await safeResponse(exchangeResponse, 201);
    await safeResponse(await owner.agent.get('/api/exchanges'));
    await safeResponse(await owner.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'CANCELLED' }));

    const currentUser = await owner.agent.get('/api/auth/me');
    expect(currentUser.body.data.email).toBe(owner.credentials.email);
  });
});

import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { prisma } from '../../config/prisma.js';
import { app } from '../../app.js';
import { createProjectCategory, createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';
import { PROJECT_TRANSITIONS } from './transitions.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function setup() {
  const owner = await registerUser();
  const category = await createProjectCategory();
  const skill = await createSkill('Testing Skill');
  return { owner, category, skill };
}

function projectBody(categoryId, skillId, overrides = {}) {
  return {
    title: 'Build a helpful app',
    description: 'A detailed project description for students to work on together.',
    categoryId,
    difficulty: 'BEGINNER',
    maxTeamSize: 4,
    skills: [{ skillId, minLevel: 'BEGINNER' }],
    ...overrides,
  };
}

async function createProject(agent, categoryId, skillId, overrides = {}) {
  const response = await agent.post('/api/projects').send(projectBody(categoryId, skillId, overrides));
  expect(response.status).toBe(201);
  return response.body.data;
}

describe('projects endpoints', () => {
  test('creates a draft project with its skills and caller as owner', async () => {
    const { owner, category, skill } = await setup();

    const response = await owner.agent.post('/api/projects').send(projectBody(category.id, skill.id));

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.myRole).toBe('OWNER');
    expect(response.body.data.owner.id).toBe(owner.user.id);
    expect(response.body.data.skills).toEqual([{ id: skill.id, name: skill.name, minLevel: 'BEGINNER' }]);
    expect(await prisma.projectSkill.count({ where: { projectId: response.body.data.id } })).toBe(1);
  });

  test('creates an open project when requested', async () => {
    const { owner, category, skill } = await setup();
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    expect(project.status).toBe('OPEN');
  });

  test.each([
    ['short title', { title: 'Tiny' }],
    ['small team', { maxTeamSize: 1 }],
    ['large team', { maxTeamSize: 11 }],
    ['bad https URL', { demoUrl: 'http://example.com' }],
  ])('rejects a project with %s', async (_name, changes) => {
    const { owner, category, skill } = await setup();
    const response = await owner.agent.post('/api/projects').send(projectBody(category.id, skill.id, changes));
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('reports unknown skill ids when creating', async () => {
    const { owner, category, skill } = await setup();
    const response = await owner.agent.post('/api/projects').send(projectBody(category.id, skill.id, {
      skills: [{ skillId: 99999, minLevel: 'BEGINNER' }],
    }));
    expect(response.status).toBe(400);
    expect(response.body.error.details.skillIds).toEqual([99999]);
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/projects');
    expect(response.status).toBe(401);
  });

  test('allows only the owner to edit a project', async () => {
    const { owner, category, skill } = await setup();
    const stranger = await registerUser();
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    const response = await stranger.agent.patch(`/api/projects/${project.id}`).send({ title: 'Updated project' });
    expect(response.status).toBe(403);
  });

  test('hides a draft from others and from the public project list', async () => {
    const { owner, category, skill } = await setup();
    const stranger = await registerUser();
    const project = await createProject(owner.agent, category.id, skill.id);

    const detail = await stranger.agent.get(`/api/projects/${project.id}`);
    const list = await stranger.agent.get('/api/projects');

    expect(detail.status).toBe(404);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([]);
  });

  test('filters by text, skill, category, difficulty, status, and open seats', async () => {
    const { owner, category, skill } = await setup();
    const extraCategory = await createProjectCategory('Research');
    const otherSkill = await createSkill('Another Skill');
    const target = await createProject(owner.agent, category.id, skill.id, {
      title: 'Unique robotics team', difficulty: 'ADVANCED', status: 'OPEN', maxTeamSize: 3,
    });
    const fullProject = await createProject(owner.agent, extraCategory.id, otherSkill.id, { title: 'Full team project', status: 'OPEN', maxTeamSize: 2 });
    const startedProject = await createProject(owner.agent, category.id, skill.id, { title: 'Work already started', status: 'OPEN' });
    await owner.agent.patch(`/api/projects/${startedProject.id}`).send({ status: 'IN_PROGRESS' });
    const member = await registerUser();
    await prisma.projectMember.create({ data: { projectId: target.id, userId: member.user.id } });
    await prisma.projectMember.create({ data: { projectId: fullProject.id, userId: member.user.id } });

    const queries = [
      '?query=robotics', `?skillIds=${skill.id}`, `?categoryId=${category.id}`,
      '?difficulty=ADVANCED', '?status=OPEN', '?hasOpenSeats=true', `?skillIds=${otherSkill.id},${skill.id}`,
    ];
    for (const query of queries) {
      const response = await owner.agent.get(`/api/projects${query}`);
      expect(response.status).toBe(200);
      expect(response.body.data.map(({ id }) => id)).toContain(target.id);
    }
    const noSeats = await owner.agent.get('/api/projects?hasOpenSeats=true');
    expect(noSeats.body.data.map(({ title }) => title)).not.toContain('Full team project');
    const inProgress = await owner.agent.get('/api/projects?status=IN_PROGRESS');
    expect(inProgress.body.data.map(({ title }) => title)).toContain('Work already started');
    expect(inProgress.body.data.map(({ id }) => id)).not.toContain(target.id);
  });

  test('filters projects owned or joined by the caller', async () => {
    const { owner, category, skill } = await setup();
    const member = await registerUser();
    const ownedDraft = await createProject(owner.agent, category.id, skill.id);
    const joinedProject = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    await prisma.projectMember.create({ data: { projectId: joinedProject.id, userId: member.user.id } });

    const owned = await owner.agent.get('/api/projects?mine=owned');
    const joined = await member.agent.get('/api/projects?mine=member');
    expect(owned.body.data.map(({ id }) => id)).toContain(ownedDraft.id);
    expect(joined.body.data.map(({ id }) => id)).toEqual([joinedProject.id]);
  });

  test('returns stable pagination metadata and an empty page', async () => {
    const { owner, category, skill } = await setup();
    await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    const page = await owner.agent.get('/api/projects?page=1&limit=1');
    expect(page.body.meta).toEqual({ page: 1, limit: 1, total: 1, totalPages: 1 });

    const empty = await owner.agent.get('/api/projects?query=nothing-matches');
    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
    expect(empty.body.meta.total).toBe(0);
  });

  test('returns computed seats and the caller application in project detail', async () => {
    const { owner, category, skill } = await setup();
    const member = await registerUser();
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN', maxTeamSize: 2 });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: member.user.id } });
    const application = await prisma.projectApplication.create({
      data: { projectId: project.id, applicantId: member.user.id, message: 'I would like to join this project.' },
    });

    const response = await member.agent.get(`/api/projects/${project.id}`);
    expect(response.body.data.seatsTaken).toBe(2);
    expect(response.body.data.seatsLeft).toBe(0);
    expect(response.body.data.isFull).toBe(true);
    expect(response.body.data.myRole).toBe('MEMBER');
    expect(response.body.data.myApplication).toEqual({ id: application.id, status: 'PENDING' });
  });

  test('cannot reduce team size below seats taken', async () => {
    const { owner, category, skill } = await setup();
    const member = await registerUser();
    const secondMember = await registerUser();
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN', maxTeamSize: 4 });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: member.user.id } });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: secondMember.user.id } });
    const response = await owner.agent.patch(`/api/projects/${project.id}`).send({ maxTeamSize: 1 });
    expect(response.status).toBe(400); // 1 is outside the documented 2..10 range
    const tooSmall = await owner.agent.patch(`/api/projects/${project.id}`).send({ maxTeamSize: 2 });
    expect(tooSmall.status).toBe(409);
  });

  test('rejects an illegal project status change', async () => {
    const { owner, category, skill } = await setup();
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    const response = await owner.agent.patch(`/api/projects/${project.id}`).send({ status: 'COMPLETED' });
    expect(response.status).toBe(409);
  });

  test('replaces skills and moves status through allowed transitions', async () => {
    const { owner, category, skill } = await setup();
    const nextSkill = await createSkill('Next Skill');
    const project = await createProject(owner.agent, category.id, skill.id, { status: 'OPEN' });
    const response = await owner.agent.patch(`/api/projects/${project.id}`).send({
      status: 'IN_PROGRESS',
      skills: [{ skillId: nextSkill.id, minLevel: 'ADVANCED' }],
    });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('IN_PROGRESS');
    expect(response.body.data.skills.map(({ id }) => id)).toEqual([nextSkill.id]);
  });

  test('keeps transitions in the documented project state table', () => {
    expect(PROJECT_TRANSITIONS).toEqual({
      DRAFT: ['OPEN', 'ARCHIVED'], OPEN: ['IN_PROGRESS', 'ARCHIVED'],
      IN_PROGRESS: ['COMPLETED', 'ARCHIVED'], COMPLETED: ['ARCHIVED'], ARCHIVED: [],
    });
  });
});

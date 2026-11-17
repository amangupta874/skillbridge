import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import { createProjectCategory, createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function createTestProject(ownerId, categoryId, skills = []) {
  const project = await prisma.project.create({
    data: {
      ownerId,
      categoryId,
      title: 'A matching test project',
      description: 'A detailed description for the matching endpoint test.',
      difficulty: 'BEGINNER',
      maxTeamSize: 5,
    },
  });
  if (skills.length) {
    await prisma.projectSkill.createMany({ data: skills.map(({ skillId, minLevel }) => ({ projectId: project.id, skillId, minLevel })) });
  }
  return project;
}

async function setupProject(skillName = 'Matching skill', minLevel = 'BEGINNER') {
  const owner = await registerUser({ fullName: 'Project Owner' });
  const category = await createProjectCategory();
  const skill = await createSkill(skillName);
  const project = await createTestProject(owner.user.id, category.id, [{ skillId: skill.id, minLevel }]);
  return { owner, category, skill, project };
}

describe('GET /api/projects/:id/matches', () => {
  test('allows only the owner to view matches', async () => {
    const { project } = await setupProject();
    const stranger = await registerUser();
    const response = await stranger.agent.get(`/api/projects/${project.id}/matches`);
    expect(response.status).toBe(403);
  });

  test('returns 404 for an unknown project', async () => {
    const { agent } = await registerUser();
    const response = await agent.get('/api/projects/00000000-0000-4000-8000-000000000000/matches');
    expect(response.status).toBe(404);
  });

  test('excludes the owner and current members', async () => {
    const { owner, skill, project } = await setupProject();
    const member = await registerUser({ fullName: 'Current Member' });
    const candidate = await registerUser({ fullName: 'Possible Match' });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: member.user.id } });
    await prisma.userSkill.createMany({ data: [owner, member, candidate].map(({ user }) => ({ userId: user.id, skillId: skill.id, level: 'ADVANCED' })) });

    const response = await owner.agent.get(`/api/projects/${project.id}/matches`);

    expect(response.status).toBe(200);
    expect(response.body.data.map(({ user }) => user.id)).toEqual([candidate.user.id]);
  });

  test('ranks a stronger candidate above a weaker one', async () => {
    const { owner, skill, project } = await setupProject('Ranking skill', 'ADVANCED');
    const weak = await registerUser({ fullName: 'Weak Candidate' });
    const strong = await registerUser({ fullName: 'Strong Candidate' });
    await prisma.userSkill.create({ data: { userId: weak.user.id, skillId: skill.id, level: 'BEGINNER' } });
    await prisma.userSkill.create({ data: { userId: strong.user.id, skillId: skill.id, level: 'ADVANCED' } });

    const response = await owner.agent.get(`/api/projects/${project.id}/matches`);

    expect(response.body.data.map(({ user }) => user.fullName)).toEqual(['Strong Candidate', 'Weak Candidate']);
    expect(response.body.data[0].score).toBeGreaterThan(response.body.data[1].score);
  });

  test('includes a candidate who only wants to learn a required skill', async () => {
    const { owner, skill, project } = await setupProject('Learning skill');
    const learner = await registerUser({ fullName: 'Skill Learner' });
    await prisma.userLearningGoal.create({ data: { userId: learner.user.id, skillId: skill.id } });

    const response = await owner.agent.get(`/api/projects/${project.id}/matches`);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].user.fullName).toBe('Skill Learner');
    expect(response.body.data[0].reasons).toContain('Wants to learn Learning skill');
  });

  test('drops candidates with a zero score', async () => {
    const { owner, skill, project } = await setupProject('Required skill');
    const unrelatedSkill = await createSkill('Unrelated skill');
    const unrelatedCandidate = await registerUser({ fullName: 'Unrelated Candidate' });
    await prisma.userSkill.create({ data: { userId: unrelatedCandidate.user.id, skillId: unrelatedSkill.id, level: 'ADVANCED' } });
    const scoringCandidate = await registerUser({ fullName: 'Scoring Candidate' });
    await prisma.userSkill.create({ data: { userId: scoringCandidate.user.id, skillId: skill.id, level: 'INTERMEDIATE' } });

    const response = await owner.agent.get(`/api/projects/${project.id}/matches`);

    expect(response.body.data.map(({ user }) => user.id)).toEqual([scoringCandidate.user.id]);
    expect(response.body.data.every(({ score }) => score > 0)).toBe(true);
  });

  test('returns no matches when the project has no required skills', async () => {
    const owner = await registerUser();
    const category = await createProjectCategory();
    const project = await createTestProject(owner.user.id, category.id);

    const response = await owner.agent.get(`/api/projects/${project.id}/matches`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test('limits the number of returned matches', async () => {
    const { owner, skill, project } = await setupProject('Limited skill');
    for (const fullName of ['Alex Candidate', 'Blair Candidate', 'Casey Candidate']) {
      const candidate = await registerUser({ fullName });
      await prisma.userSkill.create({ data: { userId: candidate.user.id, skillId: skill.id, level: 'ADVANCED' } });
    }

    const response = await owner.agent.get(`/api/projects/${project.id}/matches?limit=2`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.map(({ user }) => user.fullName)).toEqual(['Alex Candidate', 'Blair Candidate']);
  });

  test('requires a session', async () => {
    const response = await request(app).get('/api/projects/00000000-0000-4000-8000-000000000000/matches');
    expect(response.status).toBe(401);
  });
});

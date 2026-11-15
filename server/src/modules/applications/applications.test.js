import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { prisma } from '../../config/prisma.js';
import { app } from '../../app.js';
import { createProjectCategory, createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function setupProject(status = 'OPEN') {
  const owner = await registerUser();
  const category = await createProjectCategory();
  const skill = await createSkill('Application Skill');
  const response = await owner.agent.post('/api/projects').send({
    title: 'Build an application feature',
    description: 'A project where students build a useful feature together.',
    categoryId: category.id,
    difficulty: 'BEGINNER',
    maxTeamSize: 4,
    skills: [{ skillId: skill.id, minLevel: 'BEGINNER' }],
    status,
  });
  expect(response.status).toBe(201);
  return { owner, project: response.body.data };
}

const applicationMessage = 'I would like to help with this project.';

describe('applications endpoints', () => {
  test('apply ok and the owner notification exists', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser();
    const response = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const notification = await prisma.notification.findFirst({ where: { recipientId: owner.user.id } });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.allowedTransitions).toEqual(['WITHDRAWN']);
    expect(notification).toMatchObject({ type: 'APPLICATION_RECEIVED', applicationId: response.body.data.id });
  });

  test('owner gets 400 when applying to their own project', async () => {
    const { owner, project } = await setupProject();
    const response = await owner.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    expect(response.status).toBe(400);
  });

  test('hides a draft project from applicants', async () => {
    const { project } = await setupProject('DRAFT');
    const applicant = await registerUser();
    const response = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    expect(response.status).toBe(404);
  });

  test('returns 404 when applying to an unknown project', async () => {
    const applicant = await registerUser();
    const response = await applicant.agent.post('/api/projects/00000000-0000-4000-8000-000000000000/applications')
      .send({ message: applicationMessage });
    expect(response.status).toBe(404);
  });

  test('cannot apply to a project that is not open', async () => {
    const { owner, project } = await setupProject();
    await owner.agent.patch(`/api/projects/${project.id}`).send({ status: 'IN_PROGRESS' });
    const applicant = await registerUser();
    const response = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    expect(response.status).toBe(409);
  });

  test('apply twice returns 409', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    expect(response.status).toBe(409);
  });

  test('reopens an application after withdraw with a new message and time', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    const first = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    await applicant.agent.patch(`/api/applications/${first.body.data.id}`).send({ status: 'WITHDRAWN' });
    const response = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: 'I can now contribute to testing.' });
    const notifications = await prisma.notification.count({ where: { applicationId: first.body.data.id } });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ id: first.body.data.id, status: 'PENDING', message: 'I can now contribute to testing.', decidedAt: null });
    expect(new Date(response.body.data.createdAt).getTime()).toBeGreaterThan(new Date(first.body.data.createdAt).getTime());
    expect(notifications).toBe(2);
  });

  test('withdraws a pending application', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await applicant.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'WITHDRAWN' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('WITHDRAWN');
    expect(response.body.data.allowedTransitions).toEqual(['PENDING']);
  });

  test('withdraw by a stranger returns 404', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    const stranger = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await stranger.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'WITHDRAWN' });
    expect(response.status).toBe(404);
  });

  test('cannot withdraw an application that is no longer pending', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    await prisma.projectApplication.update({ where: { id: created.body.data.id }, data: { status: 'REJECTED' } });
    const response = await applicant.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'WITHDRAWN' });
    expect(response.status).toBe(409);
  });

  test('non-owner cannot list project applications', async () => {
    const { project } = await setupProject();
    const stranger = await registerUser();
    const response = await stranger.agent.get(`/api/projects/${project.id}/applications`);
    expect(response.status).toBe(403);
  });

  test('owner lists applications with the applicant card', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser({ fullName: 'Applicant Person' });
    const skill = await createSkill('Applicant Skill');
    await prisma.userSkill.create({ data: { userId: applicant.user.id, skillId: skill.id, level: 'ADVANCED' } });
    await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });

    const response = await owner.agent.get(`/api/projects/${project.id}/applications?status=PENDING&page=1&limit=1`);
    expect(response.status).toBe(200);
    expect(response.body.data[0].applicant).toMatchObject({ id: applicant.user.id, fullName: 'Applicant Person' });
    expect(response.body.data[0].applicant.topSkills[0].skill.name).toBe('Applicant Skill');
    expect(response.body.data[0].applicant.email).toBeUndefined();
    expect(response.body.data[0].allowedTransitions).toEqual(['ACCEPTED', 'REJECTED']);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1, total: 1 });
  });

  test('GET users me applications returns the caller applications', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await applicant.agent.get('/api/users/me/applications');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].project).toEqual({ id: project.id, title: project.title });
    expect(response.body.data[0].allowedTransitions).toEqual(['WITHDRAWN']);
  });

  test('application routes require a session', async () => {
    const response = await request(app).get('/api/users/me/applications');
    expect(response.status).toBe(401);
  });

  test('accept application creates the member, notification, and status change', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'ACCEPTED' });
    const member = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: project.id, userId: applicant.user.id } } });
    const notification = await prisma.notification.findFirst({ where: { applicationId: created.body.data.id, type: 'APPLICATION_ACCEPTED' } });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ACCEPTED');
    expect(response.body.data.decidedAt).not.toBeNull();
    expect(member).not.toBeNull();
    expect(notification).toMatchObject({ recipientId: applicant.user.id, type: 'APPLICATION_ACCEPTED' });
  });

  test('reject application creates a notification', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'REJECTED' });
    const notification = await prisma.notification.findFirst({ where: { applicationId: created.body.data.id, type: 'APPLICATION_REJECTED' } });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('REJECTED');
    expect(notification.recipientId).toBe(applicant.user.id);
  });

  test('deciding twice returns 409', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'REJECTED' });
    const response = await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(409);
  });

  test('accepting into a full team returns 409', async () => {
    const { owner, project } = await setupProject();
    const member = await registerUser();
    const applicant = await registerUser();
    await prisma.project.update({ where: { id: project.id }, data: { maxTeamSize: 2 } });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: member.user.id } });
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(409);
  });

  test('accepting after a project leaves OPEN returns 409', async () => {
    const { owner, project } = await setupProject();
    const applicant = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    await owner.agent.patch(`/api/projects/${project.id}`).send({ status: 'IN_PROGRESS' });
    const response = await owner.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(409);
  });

  test('non-owner gets 403 when deciding an application', async () => {
    const { project } = await setupProject();
    const applicant = await registerUser();
    const stranger = await registerUser();
    const created = await applicant.agent.post(`/api/projects/${project.id}/applications`).send({ message: applicationMessage });
    const response = await stranger.agent.patch(`/api/applications/${created.body.data.id}`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(403);
  });

  test('two simultaneous accepts for the last seat -> exactly one succeeds', async () => {
    const { owner, project } = await setupProject();
    await prisma.project.update({ where: { id: project.id }, data: { maxTeamSize: 3 } });
    const existingMember = await registerUser();
    const firstApplicant = await registerUser();
    const secondApplicant = await registerUser();
    await prisma.projectMember.create({ data: { projectId: project.id, userId: existingMember.user.id } });
    const firstApplication = await prisma.projectApplication.create({
      data: { projectId: project.id, applicantId: firstApplicant.user.id, message: applicationMessage },
    });
    const secondApplication = await prisma.projectApplication.create({
      data: { projectId: project.id, applicantId: secondApplicant.user.id, message: applicationMessage },
    });

    for (let run = 0; run < 20; run += 1) {
      const responses = await Promise.all([
        owner.agent.patch(`/api/applications/${firstApplication.id}`).send({ status: 'ACCEPTED' }),
        owner.agent.patch(`/api/applications/${secondApplication.id}`).send({ status: 'ACCEPTED' }),
      ]);
      const responseStatuses = responses.map(({ status }) => status).sort();
      const memberCount = await prisma.projectMember.count({ where: { projectId: project.id } });
      const acceptedNotifications = await prisma.notification.count({
        where: { applicationId: { in: [firstApplication.id, secondApplication.id] }, type: 'APPLICATION_ACCEPTED' },
      });
      const applicationStatuses = await prisma.projectApplication.findMany({
        where: { id: { in: [firstApplication.id, secondApplication.id] } },
        select: { status: true },
      });

      expect(responseStatuses).toEqual([200, 409]);
      expect(memberCount).toBe(2);
      expect(acceptedNotifications).toBe(1);
      expect(applicationStatuses.filter(({ status }) => status === 'ACCEPTED')).toHaveLength(1);

      await prisma.notification.deleteMany({ where: { applicationId: { in: [firstApplication.id, secondApplication.id] } } });
      await prisma.projectMember.deleteMany({ where: { projectId: project.id, userId: { in: [firstApplicant.user.id, secondApplicant.user.id] } } });
      await prisma.projectApplication.updateMany({
        where: { id: { in: [firstApplication.id, secondApplication.id] } },
        data: { status: 'PENDING', decidedAt: null },
      });
    }
  });
});

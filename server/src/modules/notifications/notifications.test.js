import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import { createProjectCategory, createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function createApplication(owner, applicant, title) {
  const category = await createProjectCategory();
  const skill = await createSkill(`${title} skill`);
  const projectResponse = await owner.agent.post('/api/projects').send({
    title,
    description: 'A useful project that needs students to work together.',
    categoryId: category.id,
    difficulty: 'BEGINNER',
    maxTeamSize: 4,
    skills: [{ skillId: skill.id, minLevel: 'BEGINNER' }],
    status: 'OPEN',
  });
  expect(projectResponse.status).toBe(201);
  const applicationResponse = await applicant.agent.post(`/api/projects/${projectResponse.body.data.id}/applications`).send({
    message: 'I would like to help with this project.',
  });
  expect(applicationResponse.status).toBe(201);
  return { project: projectResponse.body.data, application: applicationResponse.body.data };
}

async function createExchange(sender, recipient, suffix) {
  const offered = await createSkill(`Offer ${suffix}`);
  const requested = await createSkill(`Request ${suffix}`);
  await sender.agent.put('/api/users/me/skills').send({ skills: [{ skillId: offered.id, level: 'INTERMEDIATE' }] });
  await recipient.agent.put('/api/users/me/skills').send({ skills: [{ skillId: requested.id, level: 'BEGINNER' }] });
  const response = await sender.agent.post('/api/exchanges').send({
    recipientId: recipient.user.id,
    offeredSkillId: offered.id,
    requestedSkillId: requested.id,
    message: 'I can help you learn this skill.',
  });
  expect(response.status).toBe(201);
  return response.body.data;
}

describe('GET /api/notifications', () => {
  test('renders application received, accepted, and rejected notifications with their links', async () => {
    const owner = await registerUser({ fullName: 'Project Owner' });
    const applicant = await registerUser({ fullName: 'First Applicant' });
    const accepted = await createApplication(owner, applicant, 'Accepted Project');
    await owner.agent.patch(`/api/applications/${accepted.application.id}`).send({ status: 'ACCEPTED' });

    const secondApplicant = await registerUser({ fullName: 'Second Applicant' });
    const rejected = await createApplication(owner, secondApplicant, 'Rejected Project');
    await owner.agent.patch(`/api/applications/${rejected.application.id}`).send({ status: 'REJECTED' });

    const received = await owner.agent.get('/api/notifications');
    const ownerItems = received.body.data;
    expect(ownerItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'APPLICATION_RECEIVED',
        message: 'First Applicant applied to Accepted Project',
        link: `/projects/${accepted.project.id}/applications`,
      }),
      expect.objectContaining({
        type: 'APPLICATION_RECEIVED',
        message: 'Second Applicant applied to Rejected Project',
        link: `/projects/${rejected.project.id}/applications`,
      }),
    ]));

    const acceptedItems = await applicant.agent.get('/api/notifications');
    expect(acceptedItems.body.data).toContainEqual(expect.objectContaining({
      type: 'APPLICATION_ACCEPTED',
      message: 'You were accepted into Accepted Project',
      link: `/projects/${accepted.project.id}`,
    }));
    const rejectedItems = await secondApplicant.agent.get('/api/notifications');
    expect(rejectedItems.body.data).toContainEqual(expect.objectContaining({
      type: 'APPLICATION_REJECTED',
      message: 'Your application to Rejected Project was not accepted',
      link: '/applications',
    }));
  });

  test('renders received, accepted, rejected, and completed exchange notifications', async () => {
    const sender = await registerUser({ fullName: 'Exchange Sender' });
    const recipient = await registerUser({ fullName: 'Exchange Recipient' });
    const accepted = await createExchange(sender, recipient, 'accepted');
    await recipient.agent.patch(`/api/exchanges/${accepted.id}`).send({ status: 'ACCEPTED' });

    const rejectedSender = await registerUser({ fullName: 'Rejected Sender' });
    const rejectedRecipient = await registerUser({ fullName: 'Rejected Recipient' });
    const rejected = await createExchange(rejectedSender, rejectedRecipient, 'rejected');
    await rejectedRecipient.agent.patch(`/api/exchanges/${rejected.id}`).send({ status: 'REJECTED' });

    const completedSender = await registerUser({ fullName: 'Completing Sender' });
    const completedRecipient = await registerUser({ fullName: 'Completing Recipient' });
    const completed = await createExchange(completedSender, completedRecipient, 'completed');
    await completedRecipient.agent.patch(`/api/exchanges/${completed.id}`).send({ status: 'ACCEPTED' });
    await completedSender.agent.patch(`/api/exchanges/${completed.id}`).send({ status: 'COMPLETED' });

    expect((await recipient.agent.get('/api/notifications')).body.data).toContainEqual(expect.objectContaining({
      type: 'EXCHANGE_RECEIVED',
      message: 'Exchange Sender wants to swap Offer accepted for Request accepted',
      link: '/exchanges',
    }));
    expect((await sender.agent.get('/api/notifications')).body.data).toContainEqual(expect.objectContaining({
      type: 'EXCHANGE_ACCEPTED', message: 'Exchange Recipient accepted your exchange', link: '/exchanges',
    }));
    expect((await rejectedSender.agent.get('/api/notifications')).body.data).toContainEqual(expect.objectContaining({
      type: 'EXCHANGE_REJECTED', message: 'Rejected Recipient declined your exchange', link: '/exchanges',
    }));
    expect((await completedRecipient.agent.get('/api/notifications')).body.data).toContainEqual(expect.objectContaining({
      type: 'EXCHANGE_COMPLETED', message: 'Completing Sender marked your exchange completed', link: '/exchanges',
    }));
  });

  test('lists only the caller notifications and filters unread notifications', async () => {
    const sender = await registerUser();
    const recipient = await registerUser();
    const otherRecipient = await registerUser();
    const first = await createExchange(sender, recipient, 'first');
    const secondSender = await registerUser();
    const second = await createExchange(secondSender, recipient, 'second');

    expect((await sender.agent.get('/api/notifications')).body.data).toEqual([]);
    const otherUsers = await otherRecipient.agent.get('/api/notifications');
    expect(otherUsers.body.data).toEqual([]);
    const read = await prisma.notification.findFirst({ where: { exchangeId: first.id } });
    await recipient.agent.patch(`/api/notifications/${read.id}/read`);

    const unread = await recipient.agent.get('/api/notifications?unread=true');
    expect(unread.body.data).toHaveLength(1);
    expect(unread.body.data[0].id).not.toBe(read.id);
    expect(unread.body.data[0].id).toBe((await prisma.notification.findFirst({ where: { exchangeId: second.id } })).id);
    expect((await recipient.agent.get('/api/notifications')).body.data).toHaveLength(2);
  });

  test('returns newest first with pagination metadata', async () => {
    const recipient = await registerUser();
    const notifications = [];
    for (let index = 0; index < 3; index += 1) {
      const sender = await registerUser();
      const exchange = await createExchange(sender, recipient, `page-${index}`);
      notifications.push(await prisma.notification.findFirst({ where: { exchangeId: exchange.id } }));
    }
    const dates = [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-02T00:00:00Z'), new Date('2026-01-03T00:00:00Z')];
    for (let index = 0; index < notifications.length; index += 1) {
      await prisma.notification.update({ where: { id: notifications[index].id }, data: { createdAt: dates[index] } });
    }

    const firstPage = await recipient.agent.get('/api/notifications?page=1&limit=2');
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.map(({ id }) => id)).toEqual([notifications[2].id, notifications[1].id]);
    expect(firstPage.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    const secondPage = await recipient.agent.get('/api/notifications?page=2&limit=2');
    expect(secondPage.body.data.map(({ id }) => id)).toEqual([notifications[0].id]);
  });

  test('rejects invalid pagination', async () => {
    const { agent } = await registerUser();
    expect((await agent.get('/api/notifications?limit=51')).status).toBe(400);
  });
});

describe('notification read actions', () => {
  test('unread count changes after reading one notification and reading all', async () => {
    const sender = await registerUser();
    const recipient = await registerUser();
    const firstExchange = await createExchange(sender, recipient, 'read-one');
    const secondSender = await registerUser();
    await createExchange(secondSender, recipient, 'read-all');
    const firstNotification = await prisma.notification.findFirst({ where: { exchangeId: firstExchange.id } });

    expect((await recipient.agent.get('/api/notifications/unread-count')).body.data).toEqual({ count: 2 });
    const marked = await recipient.agent.patch(`/api/notifications/${firstNotification.id}/read`);
    expect(marked.status).toBe(200);
    expect(marked.body.data).toMatchObject({ id: firstNotification.id, isRead: true, type: 'EXCHANGE_RECEIVED' });
    expect((await recipient.agent.get('/api/notifications/unread-count')).body.data).toEqual({ count: 1 });

    const readAll = await recipient.agent.patch('/api/notifications/read-all');
    expect(readAll.body.data).toEqual({ updated: 1 });
    expect((await recipient.agent.get('/api/notifications/unread-count')).body.data).toEqual({ count: 0 });
    const allRead = await recipient.agent.get('/api/notifications');
    expect(allRead.body.data.every(({ isRead }) => isRead)).toBe(true);
  });

  test('returns 404 when another user tries to read a notification', async () => {
    const sender = await registerUser();
    const recipient = await registerUser();
    const exchange = await createExchange(sender, recipient, 'private');
    const notification = await prisma.notification.findFirst({ where: { exchangeId: exchange.id } });

    const response = await sender.agent.patch(`/api/notifications/${notification.id}/read`);

    expect(response.status).toBe(404);
  });

  test('requires a session for each notifications endpoint', async () => {
    expect((await request(app).get('/api/notifications')).status).toBe(401);
    expect((await request(app).get('/api/notifications/unread-count')).status).toBe(401);
    expect((await request(app).patch('/api/notifications/read-all')).status).toBe(401);
    expect((await request(app).patch('/api/notifications/00000000-0000-4000-8000-000000000000/read')).status).toBe(401);
  });
});

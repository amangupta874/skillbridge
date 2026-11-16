import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import { createSkill, registerUser, resetDatabase } from '../../../tests/helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function makeExchange(sender = null, recipient = null) {
  sender ||= await registerUser();
  recipient ||= await registerUser();
  const suffix = `${Date.now()}-${Math.random()}`;
  const offered = await createSkill(`Offered skill ${suffix}`);
  const requested = await createSkill(`Requested skill ${suffix}`);
  await prisma.userSkill.create({ data: { userId: sender.user.id, skillId: offered.id, level: 'INTERMEDIATE' } });
  await prisma.userSkill.create({ data: { userId: recipient.user.id, skillId: requested.id, level: 'BEGINNER' } });
  const response = await sender.agent.post('/api/exchanges').send({
    recipientId: recipient.user.id,
    offeredSkillId: offered.id,
    requestedSkillId: requested.id,
    message: 'I can help you learn this skill.',
  });
  return { sender, recipient, offered, requested, exchange: response.body.data, response };
}

describe('POST /api/exchanges', () => {
  test('creates an exchange and notifies the recipient', async () => {
    const { response, sender, recipient, offered, requested } = await makeExchange();

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      sender: { id: sender.user.id, fullName: sender.user.fullName },
      recipient: { id: recipient.user.id, fullName: recipient.user.fullName },
      offeredSkill: { id: offered.id, name: offered.name },
      requestedSkill: { id: requested.id, name: requested.name },
      status: 'PENDING',
      allowedTransitions: ['CANCELLED'],
    });
    expect(await prisma.notification.count({ where: { recipientId: recipient.user.id, type: 'EXCHANGE_RECEIVED' } })).toBe(1);
  });

  test('rejects an exchange with yourself', async () => {
    const { agent, user } = await registerUser();
    const response = await agent.post('/api/exchanges').send({ recipientId: user.id, offeredSkillId: 1, requestedSkillId: 2, message: 'This message is long enough.' });
    expect(response.status).toBe(400);
  });

  test('returns 404 for a missing recipient', async () => {
    const { agent } = await registerUser();
    const response = await agent.post('/api/exchanges').send({ recipientId: '00000000-0000-4000-8000-000000000000', offeredSkillId: 1, requestedSkillId: 2, message: 'This message is long enough.' });
    expect(response.status).toBe(404);
  });

  test('rejects an offered skill that is not on my profile', async () => {
    const sender = await registerUser();
    const recipient = await registerUser();
    const requested = await createSkill('Wanted');
    await prisma.userSkill.create({ data: { userId: recipient.user.id, skillId: requested.id, level: 'BEGINNER' } });
    const response = await sender.agent.post('/api/exchanges').send({ recipientId: recipient.user.id, offeredSkillId: requested.id, requestedSkillId: requested.id, message: 'This message is long enough.' });
    expect(response.status).toBe(400);
  });

  test('rejects a requested skill that is not on the recipient profile', async () => {
    const sender = await registerUser();
    const recipient = await registerUser();
    const offered = await createSkill('Known');
    const requested = await createSkill('Not known');
    await prisma.userSkill.create({ data: { userId: sender.user.id, skillId: offered.id, level: 'BEGINNER' } });
    const response = await sender.agent.post('/api/exchanges').send({ recipientId: recipient.user.id, offeredSkillId: offered.id, requestedSkillId: requested.id, message: 'This message is long enough.' });
    expect(response.status).toBe(400);
  });

  test('rejects a duplicate active exchange and allows another after rejection or cancellation', async () => {
    const { sender, recipient, exchange } = await makeExchange();
    const body = { recipientId: recipient.user.id, offeredSkillId: exchange.offeredSkill.id, requestedSkillId: exchange.requestedSkill.id, message: 'A second request for these skills.' };
    const duplicate = await sender.agent.post('/api/exchanges').send(body);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.message).toMatch(/active exchange/i);

    await recipient.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'REJECTED' });
    const afterRejected = await sender.agent.post('/api/exchanges').send(body);
    expect(afterRejected.status).toBe(201);
    await sender.agent.patch(`/api/exchanges/${afterRejected.body.data.id}`).send({ status: 'CANCELLED' });
    const afterCancelled = await sender.agent.post('/api/exchanges').send(body);
    expect(afterCancelled.status).toBe(201);
  });
});

describe('PATCH /api/exchanges/:id', () => {
  test('lets the recipient accept, reject, and the sender cancel a pending exchange', async () => {
    const { sender, recipient, exchange } = await makeExchange();
    const wrongActor = await sender.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'ACCEPTED' });
    expect(wrongActor.status).toBe(403);
    const accepted = await recipient.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'ACCEPTED' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.allowedTransitions).toEqual(['COMPLETED', 'CANCELLED']);
    expect(await prisma.notification.count({ where: { recipientId: sender.user.id, type: 'EXCHANGE_ACCEPTED' } })).toBe(1);

    const rejectedExchange = await makeExchange();
    const senderCannotReject = await rejectedExchange.sender.agent.patch(`/api/exchanges/${rejectedExchange.exchange.id}`).send({ status: 'REJECTED' });
    expect(senderCannotReject.status).toBe(403);
    const rejected = await rejectedExchange.recipient.agent.patch(`/api/exchanges/${rejectedExchange.exchange.id}`).send({ status: 'REJECTED' });
    expect(rejected.status).toBe(200);
    expect(await prisma.notification.count({ where: { recipientId: rejectedExchange.sender.user.id, type: 'EXCHANGE_REJECTED' } })).toBe(1);

    const cancelledExchange = await makeExchange();
    const recipientCannotCancel = await cancelledExchange.recipient.agent.patch(`/api/exchanges/${cancelledExchange.exchange.id}`).send({ status: 'CANCELLED' });
    expect(recipientCannotCancel.status).toBe(403);
    const cancelled = await cancelledExchange.sender.agent.patch(`/api/exchanges/${cancelledExchange.exchange.id}`).send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(await prisma.notification.count({ where: { exchangeId: cancelledExchange.exchange.id } })).toBe(1);
  });

  test('lets either participant complete or cancel an accepted exchange', async () => {
    const { sender, recipient, exchange } = await makeExchange();
    await recipient.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'ACCEPTED' });
    const completed = await sender.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'COMPLETED' });
    expect(completed.status).toBe(200);
    expect(await prisma.notification.count({ where: { recipientId: recipient.user.id, type: 'EXCHANGE_COMPLETED' } })).toBe(1);

    const second = await makeExchange();
    await second.recipient.agent.patch(`/api/exchanges/${second.exchange.id}`).send({ status: 'ACCEPTED' });
    const cancelled = await second.recipient.agent.patch(`/api/exchanges/${second.exchange.id}`).send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(await prisma.notification.count({ where: { exchangeId: second.exchange.id } })).toBe(2);
  });

  test('returns 404 to a non-participant and 409 for an illegal transition', async () => {
    const { sender, exchange } = await makeExchange();
    const outsider = await registerUser();
    const hidden = await outsider.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'ACCEPTED' });
    expect(hidden.status).toBe(404);
    const illegal = await sender.agent.patch(`/api/exchanges/${exchange.id}`).send({ status: 'COMPLETED' });
    expect(illegal.status).toBe(409);
  });

  test('requires a session', async () => {
    const response = await request(app).patch('/api/exchanges/00000000-0000-4000-8000-000000000000').send({ status: 'ACCEPTED' });
    expect(response.status).toBe(401);
  });
});

describe('GET /api/exchanges', () => {
  test('filters incoming, outgoing, status, and pages results', async () => {
    const first = await makeExchange();
    const second = await makeExchange(first.sender, first.recipient);
    const third = await makeExchange();
    await second.recipient.agent.patch(`/api/exchanges/${second.exchange.id}`).send({ status: 'ACCEPTED' });

    const outgoing = await first.sender.agent.get('/api/exchanges?box=outgoing&limit=1');
    expect(outgoing.status).toBe(200);
    expect(outgoing.body.data).toHaveLength(1);
    expect(outgoing.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    const secondPage = await first.sender.agent.get('/api/exchanges?box=outgoing&limit=1&page=2');
    expect(secondPage.body.data).toHaveLength(1);
    expect(secondPage.body.meta.page).toBe(2);
    const incoming = await first.recipient.agent.get('/api/exchanges?box=incoming');
    expect(incoming.body.data.map(({ id }) => id)).toContain(first.exchange.id);
    const accepted = await second.sender.agent.get('/api/exchanges?status=ACCEPTED');
    expect(accepted.body.data.map(({ id }) => id)).toEqual([second.exchange.id]);
    const all = await third.sender.agent.get('/api/exchanges');
    expect(all.body.data.map(({ id }) => id)).toContain(third.exchange.id);
  });

  test('requires a session and rejects invalid pagination', async () => {
    expect((await request(app).get('/api/exchanges')).status).toBe(401);
    const { agent } = await registerUser();
    expect((await agent.get('/api/exchanges?limit=51')).status).toBe(400);
  });
});

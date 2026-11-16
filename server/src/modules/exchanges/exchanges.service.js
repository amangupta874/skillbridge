import { prisma } from '../../config/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors.js';
import { EXCHANGE_TRANSITIONS, getAllowedTransitions } from './transitions.js';

const exchangeInclude = {
  sender: { select: { id: true, fullName: true } },
  recipient: { select: { id: true, fullName: true } },
  offeredSkill: { select: { id: true, name: true } },
  requestedSkill: { select: { id: true, name: true } },
};

function callerRole(exchange, callerId) {
  if (exchange.status === 'ACCEPTED') return 'participant';
  return exchange.senderId === callerId ? 'sender' : 'recipient';
}

function toExchange(exchange, callerId) {
  return {
    id: exchange.id,
    sender: exchange.sender,
    recipient: exchange.recipient,
    offeredSkill: exchange.offeredSkill,
    requestedSkill: exchange.requestedSkill,
    message: exchange.message,
    status: exchange.status,
    createdAt: exchange.createdAt,
    updatedAt: exchange.updatedAt,
    allowedTransitions: getAllowedTransitions(EXCHANGE_TRANSITIONS, exchange.status, callerRole(exchange, callerId)),
  };
}

export async function createExchange({ senderId, recipientId, offeredSkillId, requestedSkillId, message }) {
  if (senderId === recipientId) throw badRequest('You cannot exchange skills with yourself');
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) throw notFound('Student not found');
  const offeredSkill = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: senderId, skillId: offeredSkillId } },
    select: { skillId: true },
  });
  if (!offeredSkill) throw badRequest('You can only offer a skill listed on your profile');
  const requestedSkill = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: recipientId, skillId: requestedSkillId } },
    select: { skillId: true },
  });
  if (!requestedSkill) throw badRequest('That student has not listed the requested skill');

  try {
    return await prisma.$transaction(async (tx) => {
      const exchange = await tx.skillExchange.create({
        data: { senderId, recipientId, offeredSkillId, requestedSkillId, message },
      });
      await tx.notification.create({ data: { recipientId, type: 'EXCHANGE_RECEIVED', exchangeId: exchange.id } });
      const fullExchange = await tx.skillExchange.findUnique({ where: { id: exchange.id }, include: exchangeInclude });
      return toExchange(fullExchange, senderId);
    });
  } catch (error) {
    if (error?.code === 'P2002') throw conflict('An active exchange for these skills already exists');
    throw error;
  }
}

export async function listExchanges(callerId, { box, status, page, limit }) {
  const where = {
    ...(box === 'incoming' ? { recipientId: callerId } : box === 'outgoing' ? { senderId: callerId } : {
      OR: [{ senderId: callerId }, { recipientId: callerId }],
    }),
    ...(status && { status }),
  };
  const [exchanges, total] = await Promise.all([
    prisma.skillExchange.findMany({
      where,
      include: exchangeInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.skillExchange.count({ where }),
  ]);
  return { exchanges: exchanges.map((exchange) => toExchange(exchange, callerId)), page, limit, total };
}

export async function changeExchangeStatus(exchangeId, callerId, status) {
  return prisma.$transaction(async (tx) => {
    const exchange = await tx.skillExchange.findUnique({ where: { id: exchangeId }, include: exchangeInclude });
    if (!exchange || (exchange.senderId !== callerId && exchange.recipientId !== callerId)) {
      throw notFound('Exchange not found');
    }

    const allowedRole = EXCHANGE_TRANSITIONS[exchange.status]?.[status];
    if (!allowedRole) throw conflict('This exchange cannot be changed to that status');
    const role = callerRole(exchange, callerId);
    if (allowedRole !== role) throw forbidden('You cannot make this change to the exchange');

    const updated = await tx.skillExchange.update({ where: { id: exchangeId }, data: { status }, include: exchangeInclude });
    let notificationRecipientId;
    let notificationType;
    if (status === 'ACCEPTED' || status === 'REJECTED') {
      notificationRecipientId = exchange.senderId;
      notificationType = status === 'ACCEPTED' ? 'EXCHANGE_ACCEPTED' : 'EXCHANGE_REJECTED';
    } else if (status === 'COMPLETED') {
      notificationRecipientId = exchange.senderId === callerId ? exchange.recipientId : exchange.senderId;
      notificationType = 'EXCHANGE_COMPLETED';
    }
    if (notificationType) {
      await tx.notification.create({
        data: { recipientId: notificationRecipientId, type: notificationType, exchangeId },
      });
    }
    return toExchange(updated, callerId);
  });
}

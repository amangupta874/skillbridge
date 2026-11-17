import { prisma } from '../../config/prisma.js';
import { notFound } from '../../utils/errors.js';

const notificationInclude = {
  application: {
    select: {
      projectId: true,
      project: { select: { title: true } },
      applicant: { select: { fullName: true } },
    },
  },
  exchange: {
    select: {
      senderId: true,
      recipientId: true,
      sender: { select: { fullName: true } },
      recipient: { select: { fullName: true } },
      offeredSkill: { select: { name: true } },
      requestedSkill: { select: { name: true } },
    },
  },
};

function toNotification(notification) {
  let message;
  let link;
  if (notification.type === 'APPLICATION_RECEIVED') {
    const { application } = notification;
    message = `${application.applicant.fullName} applied to ${application.project.title}`;
    link = `/projects/${application.projectId}/applications`;
  } else if (notification.type === 'APPLICATION_ACCEPTED') {
    message = `You were accepted into ${notification.application.project.title}`;
    link = `/projects/${notification.application.projectId}`;
  } else if (notification.type === 'APPLICATION_REJECTED') {
    message = `Your application to ${notification.application.project.title} was not accepted`;
    link = '/applications';
  } else if (notification.type === 'EXCHANGE_RECEIVED') {
    const { exchange } = notification;
    message = `${exchange.sender.fullName} wants to swap ${exchange.offeredSkill.name} for ${exchange.requestedSkill.name}`;
    link = '/exchanges';
  } else if (notification.type === 'EXCHANGE_ACCEPTED' || notification.type === 'EXCHANGE_REJECTED') {
    const action = notification.type === 'EXCHANGE_ACCEPTED' ? 'accepted' : 'declined';
    message = `${notification.exchange.recipient.fullName} ${action} your exchange`;
    link = '/exchanges';
  } else if (notification.type === 'EXCHANGE_COMPLETED') {
    const { exchange } = notification;
    const user = notification.recipientId === exchange.senderId ? exchange.recipient.fullName : exchange.sender.fullName;
    message = `${user} marked your exchange completed`;
    link = '/exchanges';
  }

  return {
    id: notification.id,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    message,
    link,
  };
}

export async function listNotifications(recipientId, { unread, page, limit }) {
  const where = { recipientId, ...(unread && { isRead: false }) };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: notificationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);
  return { notifications: notifications.map(toNotification), page, limit, total };
}

export async function getUnreadCount(recipientId) {
  return prisma.notification.count({ where: { recipientId, isRead: false } });
}

export async function readAllNotifications(recipientId) {
  const result = await prisma.notification.updateMany({ where: { recipientId, isRead: false }, data: { isRead: true } });
  return result.count;
}

export async function readNotification(notificationId, recipientId) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, recipientId },
    data: { isRead: true },
  });
  if (result.count === 0) throw notFound('Notification not found');
  const notification = await prisma.notification.findUnique({ where: { id: notificationId }, include: notificationInclude });
  return toNotification(notification);
}

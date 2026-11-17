import { prisma } from '../config/prisma.js';

export async function cleanupExpiredSessions(client = prisma) {
  return client.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

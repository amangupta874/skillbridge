import { prisma } from '../config/prisma.js';
import { hashToken } from '../utils/token.js';
import { unauthorized } from '../utils/errors.js';

export const SESSION_COOKIE = 'sid';

// Express 5 forwards rejected promises from async middleware to the error handler automatically.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) throw unauthorized();

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });
  if (!session || session.expiresAt < new Date()) throw unauthorized('Session expired');

  req.user = session.user;
  req.sessionId = session.id;
  next();
}

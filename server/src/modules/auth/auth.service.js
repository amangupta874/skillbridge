import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { generateToken, hashToken } from '../../utils/token.js';
import { AppError, unauthorized } from '../../utils/errors.js';

function toCurrentUser(user) {
  return { id: user.id, email: user.email, fullName: user.fullName };
}

async function createSession(userId) {
  const rawToken = generateToken();
  await prisma.session.create({
    data: {
      id: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + env.SESSION_DAYS * 86400000),
    },
  });
  return rawToken;
}

export async function register({ fullName, email, password }) {
  const normalEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: { fullName, email: normalEmail, passwordHash },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE', 'An account with this email already exists');
    }
    throw err;
  }

  const rawToken = await createSession(user.id);
  return { user: toCurrentUser(user), rawToken };
}

// Dummy hash so bcrypt.compare takes the same time even when the user does not exist.
const DUMMY_HASH = '$2a$12$000000000000000000000u2a0bMVFBCCzXqAaKDqf4LA0S.2lAJq';

export async function login({ email, password }) {
  const normalEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalEmail } });

  const hash = user ? user.passwordHash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) {
    throw unauthorized('Invalid email or password');
  }

  // clean up expired sessions for this user
  await prisma.session.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const rawToken = await createSession(user.id);
  return { user: toCurrentUser(user), rawToken };
}

export async function logout(sessionId) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: env.SESSION_DAYS * 86400000,
  };
}

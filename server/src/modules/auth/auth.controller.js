import { sendData } from '../../utils/respond.js';
import { SESSION_COOKIE } from '../../middleware/requireAuth.js';
import * as authService from './auth.service.js';

export async function register(req, res) {
  const { user, rawToken } = await authService.register(req.valid.body);
  res.cookie(SESSION_COOKIE, rawToken, authService.sessionCookieOptions());
  sendData(res, user, 201);
}

export async function login(req, res) {
  const { user, rawToken } = await authService.login(req.valid.body);
  res.cookie(SESSION_COOKIE, rawToken, authService.sessionCookieOptions());
  sendData(res, user);
}

export async function logout(req, res) {
  await authService.logout(req.sessionId);
  res.clearCookie(SESSION_COOKIE, authService.sessionCookieOptions());
  res.status(204).end();
}

export async function me(req, res) {
  sendData(res, req.user);
}


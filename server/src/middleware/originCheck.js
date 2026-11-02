import { env } from '../config/env.js';
import { forbidden } from '../utils/errors.js';

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Simple CSRF defence: browsers always send Origin on state-changing requests.
// Requests without an Origin header (curl, Supertest) are allowed; they cannot carry a victim's cookie.
export function originCheck(req, res, next) {
  const origin = req.headers.origin;
  if (STATE_CHANGING.has(req.method) && origin && origin !== env.CLIENT_ORIGIN) {
    throw forbidden('Request origin is not allowed');
  }
  next();
}

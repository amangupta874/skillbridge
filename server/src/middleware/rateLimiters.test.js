import { describe, expect, test } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthLimiter } from './rateLimiters.js';

describe('auth rate limiter', () => {
  test('returns the standard 429 response after three requests', async () => {
    const app = express();
    app.post('/login', createAuthLimiter({ limit: 3, windowMs: 60_000, skip: () => false }), (req, res) => res.json({ data: 'ok' }));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await request(app).post('/login')).status).toBe(200);
    }
    const blocked = await request(app).post('/login');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
    });
  });
});

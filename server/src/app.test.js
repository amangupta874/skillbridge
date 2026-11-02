import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('./config/prisma.js', () => ({ prisma: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) } }));
vi.mock('@prisma/client', () => ({ Prisma: { PrismaClientKnownRequestError: class extends Error {} }, PrismaClient: class {} }));

import { app } from './app.js';

describe('app wiring', () => {
  test('GET /api/health reports ok and sets a request id header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  test('unknown route returns the standard 404 error body', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('security headers from helmet are present', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

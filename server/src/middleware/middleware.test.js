import { describe, test, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';

// The error handler imports Prisma only to recognise its error classes, so tests do not need a generated client.
vi.mock('@prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      constructor(message, { code }) { super(message); this.code = code; }
    },
  },
  PrismaClient: class {},
}));

import { Prisma } from '@prisma/client';
import { errorHandler } from './errorHandler.js';
import { validate } from './validate.js';
import { originCheck } from './originCheck.js';
import { conflict, forbidden, notFound } from '../utils/errors.js';

const createSchema = z.object({
  body: z.object({ title: z.string().trim().min(5), size: z.coerce.number().int().min(2).max(10) }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

function buildTestApp() {
  const app = express();
  app.use((req, res, next) => { req.log = { warn() {}, error() {} }; next(); });
  app.use(express.json());
  app.use(originCheck);
  app.post('/create', validate(createSchema), (req, res) => res.status(201).json({ data: req.valid.body }));
  app.get('/missing', () => { throw notFound('Project not found'); });
  app.get('/forbidden', () => { throw forbidden(); });
  app.get('/conflict', () => { throw conflict('The team is already full'); });
  app.get('/async-boom', async () => { throw new Error('secret internal detail'); });
  app.get('/duplicate', async () => { throw new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002' }); });
  app.use(errorHandler);
  return app;
}

describe('error handling pipeline (Express 5 + zod 4)', () => {
  const app = buildTestApp();

  test('valid body passes validation, is cleaned and coerced, and unknown fields are stripped', async () => {
    const response = await request(app).post('/create').send({ title: '  Expense app  ', size: '4', ownerId: 'hacker' });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ title: 'Expense app', size: 4 });
  });

  test('invalid body returns 400 VALIDATION_ERROR with field details', async () => {
    const response = await request(app).post('/create').send({ title: 'abc', size: 99 });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(response.body.error.details).sort()).toEqual(['body.size', 'body.title']);
  });

  test('malformed JSON returns 400', async () => {
    const response = await request(app).post('/create').set('Content-Type', 'application/json').send('{bad json');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  test('AppError helpers map to the right status and code', async () => {
    expect((await request(app).get('/missing')).body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Project not found' });
    expect((await request(app).get('/forbidden')).status).toBe(403);
    const full = await request(app).get('/conflict');
    expect(full.status).toBe(409);
    expect(full.body.error.code).toBe('CONFLICT');
  });

  test('Prisma unique violation becomes 409 DUPLICATE', async () => {
    const response = await request(app).get('/duplicate');
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE');
  });

  test('unexpected errors in async handlers return a generic 500 and never leak details', async () => {
    const response = await request(app).get('/async-boom');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('secret internal detail');
  });

  test('origin check blocks a state-changing request from another origin and allows the client origin', async () => {
    const blocked = await request(app).post('/create').set('Origin', 'https://evil.example').send({ title: 'Expense app', size: 3 });
    expect(blocked.status).toBe(403);
    const allowed = await request(app).post('/create').set('Origin', process.env.CLIENT_ORIGIN).send({ title: 'Expense app', size: 3 });
    expect(allowed.status).toBe(201);
  });
});

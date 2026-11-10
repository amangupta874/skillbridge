import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import { hashToken } from '../../utils/token.js';

const TEST_USER = {
  fullName: 'Alice Test',
  email: 'alice-auth@test.com',
  password: 'Secret1234',
};

// clean up auth-related rows before and after the whole suite
async function cleanup() {
  const emails = ['alice-auth@test.com', 'bob-auth@test.com', 'ALICE-AUTH@TEST.COM'];
  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function getCookie(res, name) {
  const header = res.headers['set-cookie'];
  if (!header) return null;
  const cookies = Array.isArray(header) ? header : [header];
  return cookies.find((c) => c.startsWith(name + '=')) || null;
}

describe('POST /api/auth/register', () => {
  test('creates a user and returns CurrentUser with a session cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      email: 'alice-auth@test.com',
      fullName: 'Alice Test',
    });
    expect(res.body.data.id).toBeTruthy();

    const cookie = getCookie(res, 'sid');
    expect(cookie).toBeTruthy();
    expect(cookie).toContain('HttpOnly');
  });

  test('response never contains passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Bob Test',
      email: 'bob-auth@test.com',
      password: 'Password1',
    });
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  test('duplicate email returns 409', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  test('email is case-insensitive', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'ALICE-AUTH@TEST.COM',
    });
    expect(res.status).toBe(409);
  });

  test('password shorter than 8 characters is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'short-pw@test.com',
      password: 'Ab1',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('password without a letter is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'no-letter@test.com',
      password: '12345678',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details['body.password']).toBeDefined();
  });

  test('password without a digit is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'no-digit@test.com',
      password: 'abcdefgh',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details['body.password']).toBeDefined();
  });

  test('fullName shorter than 2 characters is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'short-name@test.com',
      fullName: 'A',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('returns CurrentUser and sets a session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      email: 'alice-auth@test.com',
      fullName: 'Alice Test',
    });
    const cookie = getCookie(res, 'sid');
    expect(cookie).toBeTruthy();
  });

  test('wrong password returns 401 with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('unknown email returns 401 with the same message', async () => {
    const startedAt = Date.now();
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'Password1',
    });
    const elapsed = Date.now() - startedAt;

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  test('email is case-insensitive on login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ALICE-AUTH@TEST.COM',
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('alice-auth@test.com');
  });
});

describe('GET /api/auth/me', () => {
  let cookie;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    cookie = getCookie(res, 'sid').split(';')[0]; // "sid=<token>"
  });

  test('returns CurrentUser when logged in', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('alice-auth@test.com');
    expect(res.body.data.fullName).toBe('Alice Test');
  });

  test('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with an invalid cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'sid=bad-token');
    expect(res.status).toBe(401);
  });

  test('returns 401 when the session has expired', async () => {
    // register a temporary user, then manually expire the session
    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Expired User',
      email: 'expired@test.com',
      password: 'Expire123',
    });
    const token = getCookie(reg, 'sid').split(';')[0].split('=')[1];
    await prisma.session.update({
      where: { id: hashToken(token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).get('/api/auth/me').set('Cookie', `sid=${token}`);
    expect(res.status).toBe(401);

    // clean up
    const user = await prisma.user.findUnique({ where: { email: 'expired@test.com' } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the cookie and invalidates the session', async () => {
    // login first
    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    const cookie = getCookie(loginRes, 'sid').split(';')[0];
    const token = cookie.split('=')[1];

    // logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    expect(logoutRes.status).toBe(204);

    // the cookie should be cleared
    const clearedCookie = getCookie(logoutRes, 'sid');
    expect(clearedCookie).toBeTruthy(); // set-cookie header present to clear

    // session should be gone from the database
    const session = await prisma.session.findUnique({
      where: { id: hashToken(token) },
    });
    expect(session).toBeNull();

    // subsequent /me with the old cookie returns 401
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(401);
  });

  test('returns 401 when not logged in', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});


# 08. Security, testing, logging, CI

## Security checklist (each item needs a test or a documented check)
| Area | Requirement | Verified by |
|---|---|---|
| Passwords | bcryptjs cost 12; never returned or logged; generic login error | auth tests |
| Sessions | random 32-byte token; only SHA-256 hash stored; httpOnly cookie; expiry enforced; logout deletes row | auth tests (expired session = 401) |
| Authorisation | ownership/participation checked in services for projects, applications, matches, exchanges, notifications | negative tests per endpoint |
| Validation | zod on every route; unknown fields stripped; page size capped | validation tests |
| Mass assignment | clients cannot set `ownerId`, `status` (except allowed), `id`, `createdAt` | test that extra fields are ignored |
| Injection | Prisma parameterised queries; `$queryRaw` only as tagged template | code review |
| CSRF | SameSite cookie + `originCheck` | middleware test (exists) |
| Brute force | `authLimiter` on login/register | manual check on Day 22 |
| Headers/CORS | helmet; CORS only for `CLIENT_ORIGIN` with credentials | app test (exists) |
| Secrets | `.env*` ignored; `.env.example` committed; no secrets in logs | `git log -p` grep on Day 31 |
| Dependencies | lockfile committed; `npm audit` reviewed on Day 25 | audit output saved in PROGRESS |
| Privacy | email only in `/auth/me`; public profile hides it; 404 for hidden resources | tests |

## Integration test rules
- Real Express app via Supertest, real PostgreSQL test database, `beforeEach(resetDatabase)`. No mocking of Prisma in integration tests.
- Each endpoint has: a happy path, a validation failure, an unauthenticated call (401), a wrong-actor call (403 or 404), and each business-rule conflict (409).
- Required named tests (use these exact `describe`/`test` titles so the human can find them in the viva):
  register duplicate email 409; login wrong password 401 generic; protected route without cookie 401; expired session 401; edit someone else's project 403;
  apply twice 409; owner applies to own project 400; apply to non-open project 409; accept application creates member + notification;
  decide twice 409; **two simultaneous accepts for the last seat -> exactly one succeeds**; self exchange 400; duplicate active exchange 409;
  exchange transition by wrong actor 403; read another user's notification 404; search with no results 200 empty list; match list excludes owner and members.
- Unit tests: `scoreCandidate` (exists), transition tables (every row and every illegal pair), zod schemas for passwords and project create.

## Logging
`pino` JSON to stdout (hosts collect it). Levels: `info` requests and business events (`req.log.info({ applicationId, decision }, 'application decided')` from controllers/services that receive `req.log`
or via the shared `logger` with ids), `warn` expected 4xx, `error` 5xx and unhandled. Redaction is configured (cookies, authorization, password).
Never log request bodies, tokens, emails of other users or password fields. Each response carries `X-Request-Id`; include it in bug reports.

## Error handling checklist
Every expected failure is an `AppError`; unknown errors become a generic 500 and are logged with the stack; the client maps `error.code` to friendly messages;
`process.on('unhandledRejection')` logs and exits so the host restarts the process; graceful shutdown on SIGTERM closes the server and Prisma.

## Session cleanup (Day 25)
Delete expired sessions on server start and every 6 hours: `prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })` in `server.js` using `setInterval(...).unref()`.

## CI (`.github/workflows/ci.yml`, created on Day 1)
Runs on push to `main` and on every pull request: checkout, Node 22, `npm ci`, `prisma generate`, `prisma migrate deploy` against a PostgreSQL 16 service container,
then `npm run verify`. A red CI blocks merging. Do not set `NODE_ENV` for the whole job (it would change the Vite build); Vitest sets `NODE_ENV=test` itself.

## Quality gate before ANY commit that says "done"
`npm run verify` green, new behaviour covered by tests, no `console.log`, no unused code, docs/PROGRESS.md updated.

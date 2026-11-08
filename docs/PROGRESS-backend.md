# PROGRESS: BACKEND person (only the backend person's agent edits this file)

Tick a task when its "done when" in docs/10_DAILY_PLAN.md is met and `npm run verify` is green. Dates and tasks: docs/11_TEAM_SCHEDULE.md.

- [x] Day 1 setup, repo, database, migration, seed, CI (plan D1)
- [x] 2 auth backend (plan D2)                          - [ ] 3 test helpers, lookups, skills (plan D3 backend)
- [ ] 4 users backend (plan D4 backend)                 - [ ] 5 profile backend (plan D5 backend)
- [ ] 6 deploy database + API (plan D6)                 - [ ] 7 review (plan D7)
- [ ] 8 projects backend (plan D8)                      - [ ] 9 applications backend (plan D11)
- [ ] 10 decide + row lock + concurrency test (plan D12)- [ ] 11 exchanges backend (plan D15)
- [ ] 12 matching backend (plan D17)                    - [ ] 13 notifications backend (plan D19 backend)
- [ ] 14 analytics endpoint + redeploy API (plan D20 backend)  - [ ] 15 backend hardening (plan D22)
- [ ] 16 observability + performance (plan D25)         - [ ] 17 demo seed + concurrency script (plan D26)
- [ ] 18 live regression         - [ ] 19 backend fixes + reviews   - [ ] 20 API docs + deployment notes
- [ ] 21 FEATURE FREEZE         - [ ] 22-31 buffer, rehearsal, code defence, final checks

## Notes per task (files, tests added, manual checks, issues)
### Day 1 (Setup, database, migration, seed)
- **Files created / changed**:
  - `server/.env`, `server/.env.test` configured with local PostgreSQL connection.
  - `server/prisma/schema.prisma`: corrected enum formatting to multiline for Prisma 6.
  - `server/prisma/migrations/20261103173612_init/migration.sql`: created initial migration and appended `extra-constraints.sql`.
  - `server/package.json`: updated `db:reset:test` script to use `dotenv run -f .env.test`.
- **Database verification**:
  - Migrations applied to `skillbridge_dev` and `skillbridge_test`.
  - Check constraints verified in psql: `chk_team_size` on `projects`, `chk_not_self` and `uq_active_exchange` on `skill_exchanges`, `chk_one_target` on `notifications`.
  - Seeded 74 skills across 9 categories, 10 project categories, 14 interests, 1 college via `npm run db:seed`.
  - Verified `skill_demand_supply` view returns expected counts.
- **Verification**:
  - `GET /api/health` live check returned 200 `{ data: { status: 'ok' } }`.
  - `npm run verify` passed all checks (oxlint, eslint, Vitest server tests [14/14], Vitest client tests [3/3], Vite client build).

### Day 2 (Auth backend — register, login, logout, me)
- **Files created**:
  - `server/src/modules/auth/auth.schema.js`: zod schemas for register (fullName, email, password with letter+digit rules) and login.
  - `server/src/modules/auth/auth.service.js`: register (normalize email, bcrypt cost 12, create user+session, catch P2002→DUPLICATE), login (dummy hash for timing safety, generic 401, cleanup expired sessions), logout (deleteMany), sessionCookieOptions.
  - `server/src/modules/auth/auth.controller.js`: thin HTTP layer — set/clear sid cookie, delegate to service, sendData.
  - `server/src/modules/auth/auth.routes.js`: POST /register, POST /login (both rate-limited), POST /logout, GET /me (both requireAuth).
  - `server/src/modules/auth/auth.test.js`: 18 integration tests against the test database.
- **Files changed**:
  - `server/src/routes.js`: mounted authRoutes at `/api/auth`.
- **Tests (18 new, 32 total)**:
  - Register: 201+cookie, no passwordHash leak, dup email→409 DUPLICATE, case-insensitive email, short/no-letter/no-digit password→400, short name→400.
  - Login: 200+cookie, wrong password→401 generic message, unknown email→401 same message, case-insensitive email.
  - Me: 200 when logged in, 401 without cookie, 401 with bad cookie, 401 with expired session.
  - Logout: 204+clears cookie+deletes session row, subsequent /me→401, 401 when not logged in.
- **Verification**:
  - `npm run verify` passed: lint clean, 32 server tests, 3 client tests, build OK.

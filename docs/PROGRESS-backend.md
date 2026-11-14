# PROGRESS: BACKEND person (only the backend person's agent edits this file)

Tick a task when its "done when" in docs/10_DAILY_PLAN.md is met and `npm run verify` is green. Dates and tasks: docs/11_TEAM_SCHEDULE.md.

- [x] Day 1 setup, repo, database, migration, seed, CI (plan D1)
- [x] 2 auth backend (plan D2)                          - [x] 3 test helpers, lookups, skills (plan D3 backend)
- [x] 4 users backend (plan D4 backend)                 - [x] 5 profile backend (plan D5 backend)
- [x] 6 deploy database + API (plan D6; done 2026-11-14) - [ ] 7 review (plan D7)
- [x] 8 projects backend (plan D8)                      - [ ] 9 applications backend (plan D11)
- [ ] 10 decide + row lock + concurrency test (plan D12)- [ ] 11 exchanges backend (plan D15)
- [ ] 12 matching backend (plan D17)                    - [ ] 13 notifications backend (plan D19 backend)
- [ ] 14 analytics endpoint + redeploy API (plan D20 backend)  - [ ] 15 backend hardening (plan D22)
- [ ] 16 observability + performance (plan D25)         - [ ] 17 demo seed + concurrency script (plan D26)
- [ ] 18 live regression         - [ ] 19 backend fixes + reviews   - [ ] 20 API docs + deployment notes
- [ ] 21 FEATURE FREEZE         - [ ] 22-31 buffer, rehearsal, code defence, final checks

## Notes per task (files, tests added, manual checks, issues)
### Day 8 (Projects backend — 2026-11-14)
- **Files created**: `server/src/modules/projects/projects.schema.js`, `projects.controller.js`, `projects.service.js`, `projects.routes.js`, `transitions.js`, `projects.test.js`, and `transitions.test.js`.
- **Files changed**: `server/src/routes.js` mounts the projects router.
- **Endpoints**: Authenticated project create, filtered/paginated list, detail, and owner-only patch. Skills are validated and replaced transactionally. Seat counts and caller role/application are computed in response DTOs; no team-size or FULL status is stored.
- **Tests added**: 19 total (18 endpoint cases and one transition-table test checking every allowed and illegal transition). Covers validation, unknown skill ids, visibility, list filters, pagination, empty results, capacity, edit authorization, detail seats, and authentication.
- **Manual check**: Authenticated HTTP requests were exercised through the Supertest integration suite against the test database.
- **Deferred**: Nothing for the Day 8 scope.
- **Verification**: `npm run verify` passed: 81 server tests, 47 client tests, lint, and client build.

### Deployment preparation (2026-11-11; D6 checklist requested)
- **Files added**: `docs/DEPLOYMENT_RUNBOOK.md` (Neon, Render, Vercel steps); `client/vercel.json` (requested frontend proxy and SPA fallback; this file belongs to the frontend person).
- **Production settings checked**: `app.js` trusts one proxy and configures CORS for exactly `CLIENT_ORIGIN` with credentials; `originCheck` compares state-changing request origins to `CLIENT_ORIGIN`; the session cookie uses `COOKIE_SAMESITE` (runbook sets `lax`) and is `HttpOnly` and `Secure` in production. No production setting changes were needed.
- **Manual production-mode check**: started the API with `NODE_ENV=production` using `server/.env`, then requested `GET /api/health` at `http://127.0.0.1:4000/api/health`; it returned 500 because PostgreSQL rejected the configured local credentials. Repeated with `.env.test`; it failed with the same DB authentication error. Auth requests could not be exercised because the health/database connection failed first. No database URL was printed or shared. Browser use of the production `Secure` cookie over plain HTTP would also require HTTPS; cookie flags are set by code but not browser usability over HTTP.
- **Status at this check**: D6 was not complete at the time; the database and API were deployed later on 2026-11-13 (see follow-up below). Live frontend register/login/profile checks remain.
- **Verification at this check**: `npm run verify` was blocked: lint passed; client tests passed (43/43); server tests had 29 failures because PostgreSQL rejected the local test DB credentials (18 auth tests skipped after setup failure); the build phase was not reached by `verify`. `npm run build` passed separately. The test DB login was repaired on 2026-11-13 (see follow-up below).

### Deployment and local test DB follow-up (2026-11-13)
- Started the installed Homebrew PostgreSQL 18 service. This differs from the project's pinned PostgreSQL 16 version and should be aligned with PostgreSQL 16 in a later local setup pass.
- Confirmed `server/.env` connects with `select 1`. Rebuilt `server/.env.test` with `NODE_ENV=test`, `CLIENT_ORIGIN=http://localhost:5173`, and the `.env` URL using database `skillbridge_test`. Confirmed both databases exist and the test URL connects. `prisma migrate deploy` reported no pending migrations.
- `npm run verify` passed: 62 server tests, 43 client tests, and Vite build.
- Render API deployed at `https://skillbridge-6dhg.onrender.com`; `/api/health` returned `{"data":{"status":"ok"}}`, the Render health check path is `/api/health`, and the production catalogue seed completed (`Catalogue seeded.`).
- Updated `client/vercel.json` to use the public Render API host. The file remains frontend-owned; frontend deployment and live register/login/profile checks remain.

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

### Day 3 (Test helpers, lookups, skills)
- **Files created**:
  - `server/tests/helpers.js`: shared database reset, user registration, and category/skill factories.
  - `server/src/modules/lookups/`: lookup schema, service, controller, routes, and tests.
  - `server/src/modules/skills/`: skill search schema, service, controller, routes, and tests.
- **Files changed**:
  - `server/src/routes.js`: mounted `/lookups` and `/skills` routes.
- **Tests (7 new)**:
  - Lookups: response shape, unauthenticated request, empty lookup tables.
  - Skills: name/alias search and category response, invalid limit, unauthenticated request, empty search results.
  - `/lookups` accepts no query fields by contract, so it has no input validation error case.
- **Verification**:
  - `npm run verify` passed: lint clean, 39 server tests, 17 client tests, build OK.

### Days 4–5 (Users and profile backend)
- **Files created**:
  - `server/src/modules/users/users.routes.js`, `users.schema.js`, `users.controller.js`, `users.service.js`, and `users.test.js`.
- **Files changed**:
  - `server/src/routes.js`: mounted the users routes.
- **Endpoints**:
  - `GET /users/:id`: public profile without email.
  - `GET /users`: paginated user cards, name and skill filters, caller excluded.
  - `PATCH /users/me`: profile fields, college check, transactional link and interest replacement.
  - `PUT /users/me/skills` and `PUT /users/me/learning-goals`: replace sets after id and known/goal exclusivity checks.
- **Tests (22 new)**:
  - Happy paths, validation failures and unauthenticated requests for all five endpoints; unknown user, empty search, unknown ids, known/goal overlap, and public email privacy.
- **Deferred rule**:
  - The 409 check for removing a skill used in a pending or accepted exchange is deferred until the exchanges module exists.
- **Verification**:
  - `npm run verify` passed: lint clean, 62 server tests, 17 client tests, build OK.

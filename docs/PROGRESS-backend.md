# PROGRESS: BACKEND person (only the backend person's agent edits this file)

Tick a task when its "done when" in docs/10_DAILY_PLAN.md is met and `npm run verify` is green. Dates and tasks: docs/11_TEAM_SCHEDULE.md.

- [x] Day 1 setup, repo, database, migration, seed, CI (plan D1)
- [x] 2 auth backend (plan D2)                          - [x] 3 test helpers, lookups, skills (plan D3 backend)
- [x] 4 users backend (plan D4 backend)                 - [x] 5 profile backend (plan D5 backend)
- [x] 6 deploy database + API (plan D6; done 2026-11-14) - [ ] 7 review (plan D7)
- [x] 8 projects backend (plan D8)                      - [x] 9 applications backend (plan D11)
- [x] 10 decide + row lock + concurrency test (plan D12)- [x] 11 exchanges backend (plan D15)
- [x] 12 matching backend (plan D17)                    - [x] 13 notifications backend (plan D19 backend)
- [ ] 14 analytics endpoint + redeploy API (plan D20 backend)  - [x] 15 backend hardening (plan D22)
- [x] 16 observability + performance (plan D25)         - [x] 17 demo seed + concurrency script (plan D26)
- [ ] 18 live regression         - [ ] 19 backend fixes + reviews   - [ ] 20 API docs + deployment notes
- [ ] 21 FEATURE FREEZE         - [ ] 22-31 buffer, rehearsal, code defence, final checks

## Notes per task (files, tests added, manual checks, issues)
### Live regression and documentation — 2026-11-26
- **Live regression**: Used two fresh accounts, `regress-c@demo.skillbridge.test` and `regress-d@demo.skillbridge.test`, with a generated password kept in a shell variable. The full project, application, match, acceptance, notification, exchange, and logout flow matched the expected status codes and response assertions from `docs/05_API_SPEC.md`. See the task report for the status table. Demo-domain records are intentionally left in place for the seed cleanup.
- **README**: Rewrote the root README from the current schema, route/module files, client routes, package manifests, CI workflow, and deployment/demo docs. Added live links, features, Mermaid architecture and 18-table ER diagrams, a normalization note, local setup, environment-variable reference, verified test counts, deployment and security summaries, demo links, limitations, screenshots placeholder, and AI acknowledgements.
- **Verification**: Before editing, `npm ci`, `cd server && npx prisma generate`, and `npm run verify` passed on synced `main`: 175 server tests, 86 client tests, lint, and client build.
- **Differences found while documenting**: The current route tree does not mount `/analytics/skill-demand`, despite the older API and frontend specifications describing it. The README therefore does not list analytics as an available feature. The frontend currently has no `/trends` route.
- **Tests added**: None; this is documentation work.

### Day 26 (Demo data and notes — 2026-11-17)
- **Files created**: `server/prisma/seed-demo.js`, `scripts/concurrency-demo.mjs`, `docs/DEMO_SCRIPT.md`, and `docs/performance-notes.md`.
- **Files changed**: `server/package.json` adds `db:seed:demo`.
- **Demo seed**: Idempotently replaces six `@demo.skillbridge.test` accounts, five projects across OPEN, IN_PROGRESS, DRAFT, and COMPLETED, four applications, two differently-stated exchanges, and their notifications. Requires a valid `DEMO_PASSWORD` and refuses production unless `ALLOW_DEMO_SEED_IN_PRODUCTION=yes`.
- **Manual check**: Ran the demo seed twice against local development PostgreSQL; both runs printed only the six demo emails. Verified six users, five projects, and exactly two pending applications on the 2-seat last-seat project. The production guard refused an unapproved production run.
- **Concurrency check**: Ran `scripts/concurrency-demo.mjs` against a local API; responses were 200 and 409, with one member added. Reseeded afterward to restore the two pending applications.
- **Performance check**: On local development PostgreSQL only, loaded 500 temporary users, 200 projects, 2,000 user skills, 500 learning goals, and 600 applications. Recorded actual `EXPLAIN (ANALYZE, BUFFERS)` plans and view results in `docs/performance-notes.md`, verified temporary users and projects were deleted, and deleted the loader script.
- **README scope**: A root `README.md` exists, but it was not edited because the safety path limit excludes root files. Demo instructions and both script commands are documented in `docs/DEMO_SCRIPT.md`.
- **Verification**: `npm run verify` passed: 175 server tests, 77 client tests, lint, and client build.
- **Tests added**: None; the seed and concurrency scripts were exercised directly against the local development database and local API.

### Day 22 (Backend hardening — 2026-11-17)
- **Files created**: `server/src/security.test.js`, `server/src/middleware/rateLimiters.test.js`, `server/src/config/logger.test.js`, `server/src/utils/sessionCleanup.js`, and `sessionCleanup.test.js`; `docs/security-notes.md` records the audit and security checks.
- **Files changed**: `server/src/middleware/rateLimiters.js` exposes a configurable test factory while preserving `authLimiter`; `server/src/server.js` removes expired sessions at startup and every six hours; `server/src/config/logger.js` exports the options used by the configured logger; `server/src/middleware/middleware.test.js` checks generic error responses have no stack trace.
- **Tests added**: 39 covering unauthenticated access to every protected route, valid and malformed ids, stranger authorization, response-field privacy, rate limiting, session cleanup, and log redaction.
- **Audit**: `npm audit --omit=dev` reported 5 vulnerabilities (3 high, 2 moderate). The offered fixes require Prisma 7 and React Router 7 major upgrades, which violate the pinned stack; see `docs/security-notes.md`.
- **Manual check**: Security checks ran through the test suite, including a tiny Express limiter app and a captured Pino log output.
- **Verification**: `npm run verify` passed: 175 server tests, 77 client tests, lint, and client build.
- **Deferred**: Dependency upgrades remain subject to a future stack decision because audit fixes require major upgrades.

### Day 19 (Notifications backend — 2026-11-17)
- **Files created**: `server/src/modules/notifications/notifications.routes.js`, `notifications.schema.js`, `notifications.controller.js`, `notifications.service.js`, and `notifications.test.js`.
- **Files changed**: `server/src/routes.js` mounts the notifications routes.
- **Endpoints**: paginated caller-only listing with unread filtering and server-rendered messages and links, unread count, mark one read, and mark all read. Related names and titles are loaded in bulk with the notification list.
- **Tests added**: 8 covering application and exchange message/link rendering, caller privacy, unread filtering and counts, read and read-all, wrong-user 404, newest-first pagination, and authentication.
- **Manual check**: Notification HTTP flows were exercised through Supertest using application and exchange endpoints to create the notifications.
- **Verification**: `npm run verify` passed: 136 server tests, 74 client tests, lint, and client build.
- **Deferred**: Nothing for this task.

### Day 17 (Matching backend — 2026-11-17)
- **Files created**: `server/src/modules/matching/matching.routes.js`, `matching.schema.js`, `matching.controller.js`, `matching.service.js`, and `matching.test.js`.
- **Files changed**: `server/src/modules/projects/projects.routes.js` mounts the matching route before project detail handling.
- **Endpoint**: owner-only match list with bulk team/candidate skill and learning-goal queries, top-three skill cards, score ordering, and a capped result limit. The existing `scoreCandidate.js` was left unchanged.
- **Tests added**: 9 covering owner access, missing projects, team exclusion, ranking, learning-only candidates, zero-score exclusion, no required skills, limit, and authentication.
- **Manual check**: Matching requests were exercised through Supertest integration tests against the test database.
- **Verification**: `npm run verify` passed: 128 server tests, 74 client tests, lint, and client build.
- **Deferred**: Nothing for this task.

### Day 15 (Exchanges backend — 2026-11-16)
- **Files created**: `server/src/modules/exchanges/exchanges.routes.js`, `exchanges.schema.js`, `exchanges.controller.js`, `exchanges.service.js`, `exchanges.test.js`, and `transitions.js` / `transitions.test.js`.
- **Files changed**: `server/src/routes.js` mounts the exchanges router; `server/src/modules/users/users.service.js` blocks removing a skill offered in a PENDING or ACCEPTED exchange; `users.test.js` covers that conflict.
- **Endpoints**: create, filtered/paginated incoming/outgoing/all lists, and participant status changes. Exchange notifications are created in the same transaction. DTOs include the caller's allowed transitions.
- **Tests added**: 14 covering creation validation and notification, active duplicates and reopening after REJECTED/CANCELLED, allowed and illegal transition pairs and actors, notifications, participant privacy, filters, pagination, authentication, and offered-skill removal.
- **Manual check**: Exchange HTTP flows were exercised through Supertest integration tests against the test database, including transaction-created notifications and skill removal rejection.
- **Verification**: `npm run verify` passed: 119 server tests, 61 client tests, lint, and client build.
- **Deferred**: Nothing for the Day 15 scope.

### Day 12 (Deciding applications — 2026-11-15)
- **Files changed**: `server/src/modules/applications/applications.schema.js`, `applications.controller.js`, `applications.service.js`, and `applications.test.js`.
- **Behaviour**: owner ACCEPTED and REJECTED decisions run in a transaction with a project-row lock, re-read the application after locking, and check project status and seats before accepting. Member, application status, and decision notification commit together. DTO transitions depend on the caller.
- **Tests added**: accept/member/notification, reject notification, deciding twice, full team, non-OPEN project, non-owner, plus the required last-seat concurrency case.
- **Manual check**: the Supertest concurrency test ran 20 simultaneous-accept rounds; every round returned one 200 and one 409, with two project member rows and one APPLICATION_ACCEPTED notification.
- **Verification**: `npm run verify` passed: 105 server tests, 51 client tests, lint, and client build. All 20 concurrency rounds passed.

### Day 11 (Applications backend — 2026-11-15)
- **Files created**: `server/src/modules/applications/applications.routes.js`, `applications.schema.js`, `applications.controller.js`, `applications.service.js`, `applications.test.js`, and `transitions.js` / `transitions.test.js`.
- **Files changed**: `server/src/routes.js` mounts the application routes before the generic users route so `/users/me/applications` matches correctly.
- **Endpoints**: apply, reopen WITHDRAWN applications, applicant withdraw, owner project listing, and caller's application listing. APPLICATION_RECEIVED is created in the same transaction. Application DTOs include a privacy-safe applicant card and transitions for the caller.
- **Tests added**: apply/notification, own project, missing and hidden DRAFT, non-OPEN, duplicate, reopen, withdraw, wrong actor/state, owner listing with applicant card and pagination, `/users/me/applications`, 401, and transition table coverage.
- **Manual check**: application HTTP flows and route ordering were exercised through the Supertest integration suite against the test database.
- **Verification**: `npm run verify` passed: 98 server tests, 51 client tests, lint, and client build.
- **Deferred to Task 2**: owner ACCEPTED/REJECTED actions and the project row-lock decision transaction.

### Joined projects status fix (2026-11-15)
- **Files changed**: `server/src/modules/projects/projects.service.js`, `projects.test.js`.
- **Behaviour**: `mine=member` without a status filter returns joined OPEN, IN_PROGRESS, and COMPLETED projects; ARCHIVED remains hidden. Unfiltered lists still default to OPEN, and owned lists keep their existing status behaviour.
- **Tests added**: a joined project remains visible after moving to IN_PROGRESS and disappears after ARCHIVED; the unfiltered default still returns only OPEN projects.
- **Manual check**: exercised the project status and member-list flow through the Supertest integration suite.
- **Verification**: `npm run verify` passed: 83 server tests, 51 client tests, lint, and client build.

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

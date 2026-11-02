# 10. Daily plan: 26 Oct to 25 Nov 2026 (31 days)

Rules: one day = one work package. Do only the current day's scope. A day is DONE only when `npm run verify` is green, the manual check passes and PROGRESS.md is updated.
If a day slips, finish it first, then shift later days; never skip tests to catch up. Buffer days (Sundays) absorb slips. Feature freeze at end of Day 28.
If time runs out, cut in this order: F-12 trends page, dashboard polish, client tests beyond the core four, `hasOpenSeats` filter. NEVER cut: auth, projects, applications + capacity lock, exchanges, matching, deployment, tests for business rules.
"Read first" lists the docs to open before coding.

## WEEK 1 (26 Oct to 1 Nov): foundation
**D1 Mon 26 Oct: setup, database, repository.** Read first: 02, 03, 04.
Tasks: install Node 22 + PostgreSQL 16; create `skillbridge_dev` and `skillbridge_test`; copy env examples; `npm install`; `npx prisma generate`; first migration with the extra SQL appended (exact steps in doc 04); seed catalogue;
init Git, create public GitHub repo, push, protect `main`; add README skeleton (from the template in the repo), `.github/workflows/ci.yml` already provided: confirm it runs green on GitHub.
Done when: `npm run verify` green locally and in CI; `GET /api/health` returns 200 with the real database; psql shows all constraints; 74 skills in `skills`.

**D2 Tue 27 Oct: authentication backend.** Read first: 05 (Auth), 06 (Auth), 08.
Tasks: `modules/auth` (routes, schema, controller, service, session helper), mount in `routes.js`, `authLimiter` on login/register, cookie helper, `requireAuth` on `/me` and `/logout`.
Tests: register ok / duplicate 409 / weak password 400, login ok / wrong password 401 / unknown email 401 (same message), `/me` with and without cookie, expired session 401, logout deletes session, response never contains `passwordHash`.
Done when: all auth tests pass; manual curl/Thunder Client register-login-me-logout works and the cookie is `HttpOnly`.

**D3 Wed 28 Oct: test helpers, lookups, skills; client foundation.** Read first: 03 (test helpers), 05 (Lookups, Skills), 07.
Tasks: `tests/helpers.js`; `modules/lookups` (`GET /lookups`) and `modules/skills` (`GET /skills`) with tests; client: `api/client.js`, `AuthProvider`, `ProtectedRoute`, `AppLayout` (navbar), `AuthLayout`, shared components Button/Input/ErrorBanner/Spinner/EmptyState/Toast, router with placeholder pages.
Done when: tests green; the app shows a navbar, redirects anonymous users to `/login`.

**D4 Thu 29 Oct: auth pages; users backend.** Read first: 05 (Users), 07 (Auth flow).
Tasks: Login and Register pages with validation, server field errors, pending state; logout; dashboard placeholder showing the user's name; backend `GET /users/:id`, `GET /users` (+ tests: no email leaks, excludes caller, filters by skillId).
Client tests: login form validation and server error, ProtectedRoute redirect.
Done when: register, login, logout work in the browser against the real API; tests green.

**D5 Fri 30 Oct: profile.** Read first: 05 (Users), 06 (Profile), 07.
Tasks: `PATCH /users/me`, `PUT /users/me/skills`, `PUT /users/me/learning-goals` (+ validation of ids, known/goal exclusivity, links, interests) with tests; client: public profile page, edit profile page (basic info, links, interests, skills with level, goals) with `SkillPicker`.
Done when: a user can fill the whole profile and see it on `/users/:id`; tests green.

**D6 Sat 31 Oct: FIRST DEPLOYMENT (skeleton).** Read first: 09.
Tasks: managed PostgreSQL; API service with env vars and `prisma migrate deploy`; run seed against production; static frontend with the `/api` rewrite; verify register, login, profile on the LIVE URL; write URLs in PROGRESS.md; fix cookie/CORS problems now.
Done when: a new account can register, log in and edit its profile on the live site.

**D7 Sun 1 Nov: buffer and review.** Re-read the week's code against AGENTS.md rules; fix leftovers; refactor duplicates; update docs and PROGRESS; list what slipped.

## WEEK 2 (2 to 8 Nov): core workflows
**D8 Mon 2 Nov: projects backend.** Read first: 05 (Projects), 06 (Projects, state machines).
Tasks: `modules/projects` create/get/patch/list with filters, sorting, pagination, DTO mappers (`seatsTaken`, `seatsLeft`, `isFull`, `myRole`, `myApplication`), `transitions.js` + unit tests.
Tests: create, validation, owner-only edit 403, DRAFT hidden 404, filters, pagination meta, empty list 200, cannot shrink below seatsTaken, illegal status 409.
Done when: tests green; Thunder Client run-through works.

**D9 Tue 3 Nov: discovery UI.** Read first: 07 (Projects pages).
Tasks: `ProjectCard`, `ProjectFilters`, Pagination, `/projects` page with URL-synced filters, `ProjectDetail` page (read-only parts, seats bar, members, skills).
Done when: filters, pagination, empty/loading/error states all work against real data.

**D10 Wed 4 Nov: project form and my projects.** Tasks: create/edit form with skill rows and levels, status change controls with confirm, `/my-projects` (owned/joined tabs). Client test: filters or form validation.
Done when: an owner can create, publish, edit and archive a project from the UI.

**D11 Thu 5 Nov: applications backend (without deciding).** Read first: 05 (Applications), 06 (Applying).
Tasks: apply (+ reopen of WITHDRAWN), withdraw, list for project (owner), list mine, DTO with `allowedTransitions`; notifications creation for APPLICATION_RECEIVED.
Tests: apply ok, own project 400, non-open 409, duplicate 409, reopen after withdraw, withdraw by stranger 404, non-owner list 403.

**D12 Fri 6 Nov: deciding with the row lock (most important day).** Read first: 06 (Deciding), 08.
Tasks: `decideApplication` exactly as in doc 06; `PATCH /applications/:id` routing owner vs applicant actions; notifications for accepted/rejected.
Tests: accept creates member + notification, reject, decide twice 409, full team 409, non-open project 409, wrong actor 403, and the **Promise.all last-seat test**.
Done when: the concurrency test passes 20 times in a row (run it in a loop once) and PROGRESS.md records it.

**D13 Sat 7 Nov: applications UI.** Tasks: Apply dialog on project detail, `/applications` page with withdraw, owner review queue (accept/reject with confirm), seat indicator updates after accept (invalidate queries).
Done when: full flow works in the browser with two accounts.

**D14 Sun 8 Nov: buffer, redeploy, regression.** Redeploy; run the two-account flow on the live URL; update PROGRESS; fix slips.

## WEEK 3 (9 to 15 Nov): exchanges, matching, notifications, dashboard
**D15 Mon 9 Nov: exchanges backend.** Read first: 05 (Exchanges), 06 (Skill exchange).
Tests: create ok, self 400, offered skill not on own profile 400, requested skill not on recipient 400, duplicate active 409 (and allowed again after REJECTED), every transition by the right and wrong actor, non-participant 404, notifications, removing an offered skill in use 409.

**D16 Tue 10 Nov: exchanges UI and people search.** Tasks: `/people` page, request-exchange dialog from a profile (pick my offered skill and their skill), `/exchanges` page with tabs and action buttons from `allowedTransitions`.

**D17 Wed 11 Nov: matching backend.** Read first: 06 (Matching).
Tasks: `matching.service.js` + route; tests: owner only 403, excludes owner and members, ranks a stronger candidate higher, drops score 0, no required skills returns empty, no N+1 queries (candidates and skills loaded in bulk).

**D18 Thu 12 Nov: matching UI.** Tasks: `/projects/:id/matches` with `MatchCard` (score bar, 4 breakdown bars, reasons), link from the project page and review queue.

**D19 Fri 13 Nov: notifications.** Tasks: backend list/unread-count/read/read-all with server-rendered message and link (+ tests: only own, 404 otherwise, order); client bell with unread badge (30 s refetch), `/notifications` page.

**D20 Sat 14 Nov: dashboard and trends.** Tasks: dashboard sections from existing endpoints (recommended = open projects needing at least one of my skills); `GET /analytics/skill-demand` + `/trends` page (F-12).

**D21 Sun 15 Nov: buffer, redeploy, full regression on live.** Run the entire demo scenario (doc 01 / README) on the live site and log every defect in PROGRESS.md.

## WEEK 4 (16 to 22 Nov): quality and release
**D22 Mon 16 Nov: backend hardening.** Sweep every endpoint for the five test kinds (happy, validation, 401, wrong actor, conflict); fix gaps; check rate limiting returns 429 on the 31st login in 15 minutes (temporarily lower the limit in a test via env or a dedicated test with the limiter enabled); review all `select` fields for leaks.

**D23 Tue 17 Nov: frontend polish.** Loading/empty/error everywhere, 360 px layouts, confirm dialogs, toasts, copy review, consistent badges.

**D24 Wed 18 Nov: accessibility and client tests.** Labels, focus, keyboard, modal focus trap, contrast; add the four core client tests from doc 07.

**D25 Thu 19 Nov: observability and performance.** Session cleanup job, graceful shutdown check, log review (no secrets), `EXPLAIN ANALYZE` notes in `docs/performance-notes.md`, `npm audit` review.

**D26 Fri 20 Nov: demo data and scripts.** `prisma/seed-demo.js` (6 users, 5 projects, applications, exchanges), `docs/DEMO_SCRIPT.md` (7-step scenario), `scripts/concurrency-demo.mjs` (fires two accepts at once against a URL), final production config.

**D27 Sat 21 Nov: documentation.** Full README (problem, features, stack, architecture and ER diagram images, setup, env vars, API summary, tests, deployment, security decisions, known limitations, acknowledgements and AI usage, live URL, screenshots), `docs/api.md` summary, update docs to match reality.

**D28 Sun 22 Nov: buffer and FEATURE FREEZE.** Bug fixing only from now on. Redeploy; full regression on live.

## FINAL (23 to 25 Nov)
**D29 Mon 23 Nov: rehearsal.** Run the demo script on the live URL start to finish twice; fix only bugs.
**D30 Tue 24 Nov: code defence preparation.** Write `docs/CODE_TOUR.md` (each module: purpose, key functions, one design decision), answers to the viva questions (normal forms, the row lock, sessions vs JWT, why Postgres, authorisation, derived data), tag `v1.0.0`.
**D31 Wed 25 Nov: final checks.** Fresh clone: follow the README to run locally; live smoke test; `pg_dump` backup; grep git history for secrets; warm the service; confirm repo is public with clean history. Submit.

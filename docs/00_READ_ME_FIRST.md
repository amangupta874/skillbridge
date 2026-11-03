# 00. Read me first

This folder is the complete specification for SkillBridge. The human owner has already passed the Stage 1 design review.
Your job is to BUILD the product exactly as specified, day by day, and have it deployed and demo-ready by 25 Nov 2026.

## Reading order
1. `AGENTS.md` (rules, repeated every session)  2. `PROGRESS.md` (where we are)  3. `11_TEAM_SCHEDULE.md` (who does what today) and `10_DAILY_PLAN.md` (details of each task)
4. The docs named under "Read first" for today. Reference docs: 01 requirements, 02 stack, 03 architecture, 04 database,
05 API, 06 business logic, 07 frontend, 08 security/testing/logging, 09 deployment.

## What already exists in the repository (verified)
- Root npm workspace (`server`, `client`), ESLint + Prettier config, `npm run verify` (lint + tests + build). It passes.
- `server/`: env loader, logger, Prisma client, `AppError` helpers, error handler, zod `validate`, `requireAuth`, `originCheck`,
  auth rate limiter, `app.js`, `server.js`, health route, the pure matching function `scoreCandidate` with tests, seed script + catalogue.
- `server/prisma/schema.prisma` (final schema, 18 tables) and `extra-constraints.sql` (CHECKs, partial unique index, analytics view).
- `client/`: Vite + React 18 + Tailwind 4 + Router 6 + TanStack Query + react-hook-form + zod, with a smoke test proving the versions work together.
- NOT yet written: every module except `matching/scoreCandidate`, every page, the first migration, CI, README, deployment. That is your work.

## How facts are labelled
- "MUST" / "NEVER" = non-negotiable. "SHOULD" = default unless the human says otherwise.
- IDs: F-xx features, FR-xx functional requirements, BR-xx business rules, D-xx daily tasks. Mention IDs in commits and PROGRESS.md.
- JSON uses camelCase. Database columns use snake_case (Prisma `@map`). Dates are ISO 8601 UTC strings. IDs are UUID strings except lookup tables (integers).

## Changes since the Stage 1 PDF (these docs win over the PDF)
1. ES modules and plain JavaScript on the server (the PDF snippets use `require`; translate to `import`).
2. `bcryptjs` (pure JavaScript, same bcrypt algorithm) instead of native `bcrypt`, to avoid build failures on Windows.
3. Extra endpoints needed to make the UI work: `GET /api/lookups`, `GET /api/users`, `PUT /api/users/me/learning-goals`,
   `GET /api/notifications/unread-count`, `GET /api/analytics/skill-demand`. The PDF's `DELETE /api/projects/:id` is replaced by `PATCH` status `ARCHIVED`.
4. List responses carry `meta` (pagination). Notifications carry a server-rendered `message` and `link` (derived, not stored).
5. Package majors are pinned because newer majors break the design: Prisma 6 (not 7), `@hookform/resolvers` 5 (not 6), React 18 (not 19), React Router 6.

## Explicit non-goals (do NOT build; if asked, say it is out of scope)
Chat, email sending, password reset by email, OAuth/social login, file/image upload, admin panel, team task boards,
payments, real-time sockets, push notifications, i18n, dark mode, TypeScript migration, microservices, caching layers, GraphQL.

## When you are unsure
Stop and ask the human a specific question with 2 or 3 options and your recommendation. Do not invent behaviour. Record the answer in `PROGRESS.md` under "Decisions".

# AGENTS.md: SkillBridge (read this first, every session)

SkillBridge is a student collaboration platform: profiles with skills, project discovery, applications and team formation,
peer skill exchange, explainable teammate matching, in-app notifications.
It is a 2-student college capstone (AP + DE courses). It must be **deployed live and demo-ready by 25 Nov 2026**
(evaluation 26 Nov to 4 Dec, includes a code defence). Code must therefore be **simple, readable and explainable**.

## Session protocol (mandatory, in this order)
0. The human tells you their ROLE: BACKEND or FRONTEND (two students work in parallel). If not told, ask. Work only inside your role (see "Two-person workflow").
1. Read `docs/PROGRESS.md` (shared), your role file (`docs/PROGRESS-backend.md` or `docs/PROGRESS-frontend.md`), today's row in `docs/11_TEAM_SCHEDULE.md`,
   then ONLY your part of the named plan day in `docs/10_DAILY_PLAN.md`. Work on that scope only.
2. Read the docs that section lists under "Read first". Do not rely on memory of earlier sessions.
3. Source of truth when documents disagree: `server/prisma/schema.prisma` > `docs/05_API_SPEC.md` >
   `docs/06_BUSINESS_LOGIC.md` > `docs/07_FRONTEND_SPEC.md` > everything else. If still unclear, STOP and ask the human. Never guess.
4. Write the code AND its tests together. Run `npm run verify` from the repo root. It must pass before you say a task is done.
5. Update YOUR role's progress file (tick items, files created, deviations and why). `docs/PROGRESS.md` is only for shared decisions, live URLs and deviations. Commit with Conventional Commits
   (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`), one logical change per commit.
6. Never claim something works unless you ran it. Paste the failing output when something fails; do not hide or skip it.

## Two-person workflow (mandatory)
- BACKEND role: change only `server/` (plus docs 04/05/06 when an API or database change was approved by the human). FRONTEND role: change only `client/` (plus doc 07).
  Files outside your folder (root `package.json`, `package-lock.json`, `.github/`, `AGENTS.md`, other docs) need the human's approval first.
- The API contract is `docs/05_API_SPEC.md`. Backend must not change response shapes without approval. Frontend must not invent fields: if a field is missing,
  STOP and tell the human to ask the backend person; record the answer in `docs/PROGRESS.md` "Decisions". Until the real API is merged, frontend uses sample data
  shaped exactly like the DTOs in doc 05 (keep it in `client/src/api/sampleData.js`, delete when wired).
- Work on a branch named `feature/<role>-<topic>` (example `feature/backend-auth`). Never commit to `main`. Do not push or open pull requests unless the human asks.
- Run `npm run verify` before every commit. Merge conflicts: keep both sides' intent, rerun verify, tell the human what you merged.

## Pinned stack (do not change or add alternatives; see docs/02_TECH_STACK.md)
| Layer | Use |
|---|---|
| Runtime | Node.js 22 LTS, JavaScript with ES modules (`"type": "module"`), NO TypeScript |
| Server | Express 5, zod 4, Prisma 6 (NOT 7), PostgreSQL 16, pino + pino-http, helmet, cors, cookie-parser, express-rate-limit, bcryptjs, dotenv |
| Server tests | Vitest + Supertest against a separate test database |
| Client | React 18 + Vite, React Router 6 (`react-router-dom@6`), TanStack Query 5, axios, react-hook-form + `@hookform/resolvers` + zod 4, Tailwind CSS 4 (`@tailwindcss/vite`, no tailwind.config.js) |
| Hosting | static frontend + Node service + managed PostgreSQL (see docs/09_DEPLOYMENT.md) |

## Architecture rules (never break)
- Layers: `routes -> validate(zod) -> controller -> service -> prisma`. Controllers handle HTTP only. Services hold ALL business
  rules, authorisation and transactions and never touch `req`/`res`. Prisma is used only in services (and `requireAuth`, seed).
- Modules live in `server/src/modules/<name>/` with files: `<name>.routes.js`, `.schema.js`, `.controller.js`, `.service.js`, `.test.js`.
- Success body: `{ "data": ... }`; lists: `{ "data": [...], "meta": { page, limit, total, totalPages } }`.
  Error body: `{ "error": { "code", "message", "details" } }`. Throw `AppError` helpers from `utils/errors.js`; never build error JSON by hand.
- Authorisation is checked in the service on EVERY protected operation (ownership, membership, participation). Hiding a UI button is not security.
- Use the starter files already in `server/src` (env, logger, errors, errorHandler, validate, requireAuth, originCheck, app, server). Extend them; do not rewrite them.
- Derived data is NEVER stored: no `current_team_size`, no `FULL` status, no notification message text, no stored match score.
  Seats taken = `1 + count(project_members)` (the owner holds one seat and is not in `project_members`).
- Accepting an application MUST use one transaction with `SELECT ... FOR UPDATE` on the project row, then re-read status and member count
  (exact code in docs/06_BUSINESS_LOGIC.md). A test must prove two simultaneous accepts for the last seat produce exactly one success.
- Schema changes only through a NEW Prisma migration. Never edit an applied migration. Raw-SQL constraints live in `server/prisma/extra-constraints.sql`.
- All state changes follow the transition tables in docs/06. Illegal transition = 409 `CONFLICT`.

## Security rules
- Never return `passwordHash`, session ids or other users' emails. Never log passwords, cookies or tokens.
- Passwords: 8 to 72 characters (bcrypt limit), hashed with bcryptjs cost 12. Same error message for unknown email and wrong password.
- Session cookie `sid`: httpOnly, `secure` in production, SameSite from env, 7 days; only the SHA-256 hash of the token is stored.
- Validate body, query and params with zod on every route; unknown fields are stripped. Cap page size at 50.
- Never commit `.env` files. Keep `.env.example` files current. No secrets in code, tests or docs.

## Code style
- Simple, readable code with clear names (`applicationStatus`, not `st`). Small functions. Comments explain WHY, not what.
- No clever one-liners, no premature abstraction, no dead code, no commented-out code, no `console.log` (use the logger; the client may use none).
- No placeholder or stub shown as finished. No invented endpoints, tables or fields: if the docs do not define it, ask.
- New dependency = add it to docs/02_TECH_STACK.md and to the README acknowledgements in the same commit, and tell the human.
- Frontend: every page has loading, empty and error states; forms show field errors from `error.details`; buttons are disabled while submitting.

## Commands (run from repo root unless noted)
`npm install` | `npm run dev` (server + client) | `npm run lint` | `npm test` | `npm run build` | `npm run verify` (lint + test + build, the gate)
Server (inside `server/`): `npx prisma migrate dev` | `npx prisma generate` | `npm run db:seed` | `npm run db:reset:test`

## Definition of done for any task
Code + tests written, `npm run verify` green, manual check described in PROGRESS.md, docs updated if behaviour or API changed,
no TODOs left for in-scope work, commit made. Then stop and report: what was done, what was verified, what is next.

## Document index (all in `docs/`)
00_READ_ME_FIRST, 01_PRODUCT_REQUIREMENTS, 02_TECH_STACK, 03_ARCHITECTURE, 04_DATABASE, 05_API_SPEC, 06_BUSINESS_LOGIC,
07_FRONTEND_SPEC, 08_SECURITY_TESTING_LOGGING, 09_DEPLOYMENT, 10_DAILY_PLAN, 11_TEAM_SCHEDULE, PROGRESS, PROGRESS-backend, PROGRESS-frontend, PROMPTS.
Original design document: `docs/reference/SkillBridge_Stage1_Design_Document.pdf` (background only; the markdown docs override it).

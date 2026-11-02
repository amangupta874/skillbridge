# PROGRESS (the agent updates this file at the end of every task and every day)

Last verified: 2026-11-02, npm run verify green        Live URL: (fill after D6)        API URL: (fill after D6)        Repo: (fill on D1)

## Status by day (tick when DONE per docs/10 "Done when")
- [x] D1 setup, database, repository      - [ ] D2 auth backend              - [ ] D3 helpers, lookups, skills, client foundation
- [ ] D4 auth pages, users backend        - [ ] D5 profile                    - [ ] D6 first deployment
- [ ] D7 buffer/review                    - [ ] D8 projects backend           - [ ] D9 discovery UI
- [ ] D10 project form, my projects       - [ ] D11 applications backend      - [ ] D12 deciding + row lock + concurrency test
- [ ] D13 applications UI                 - [ ] D14 buffer/redeploy           - [ ] D15 exchanges backend
- [ ] D16 exchanges UI, people            - [ ] D17 matching backend          - [ ] D18 matching UI
- [ ] D19 notifications                   - [ ] D20 dashboard, trends         - [ ] D21 buffer/regression on live
- [ ] D22 backend hardening               - [ ] D23 frontend polish           - [ ] D24 accessibility, client tests
- [ ] D25 observability, performance      - [ ] D26 demo data, scripts        - [ ] D27 documentation
- [ ] D28 buffer, FEATURE FREEZE          - [ ] D29 rehearsal                 - [ ] D30 code defence prep
- [ ] D31 final checks and submit

## Current day notes
Day 1: Setup, database, and repository.
- Dependencies installed via `npm install` for root, server, and client workspaces.
- Schema fix: Formatted Prisma enum definitions across multiple lines in `server/prisma/schema.prisma` for Prisma 6 compatibility.
- Generated Prisma client (`npx prisma generate`).
- Created initial migration `20261102162407_init` with `extra-constraints.sql` appended (team size check, self-exchange check, partial unique index for active exchanges, notification target check, and `skill_demand_supply` SQL view).
- Applied migrations to `skillbridge_dev` and `skillbridge_test`.
- Seeded catalogue: 74 skills, 9 skill categories, 10 project categories, 14 interests, 1 college.
- Verified in PostgreSQL: `chk_team_size`, `chk_not_self`, `chk_one_target`, `uq_active_exchange`, and `skill_demand_supply` view.
- Manual check: `GET /api/health` against live database returned 200 `{ data: { status: 'ok' } }` with X-Request-Id and security headers.
- Git initialized on branch `main` with `.gitignore` properly excluding secrets and node_modules.
- What is next: D2 auth backend (`modules/auth`).

## Decisions (answers from the human)
- 2026-11-02: PostgreSQL databases `skillbridge_dev` and `skillbridge_test` created; configured with connection string `postgresql://amangupta@localhost:5432/*`.

## Deviations from the docs (must be justified; ask the human first)
- (none)

## Known issues / risks
- (none)

## Verification log
- 2026-11-02: `npm run verify` -> PASS (ESLint 0 errors, oxlint 0 errors, 14 server tests passed, 3 client tests passed, client vite build succeeded).

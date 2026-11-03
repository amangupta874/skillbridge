# PROGRESS: BACKEND person (only the backend person's agent edits this file)

Tick a task when its "done when" in docs/10_DAILY_PLAN.md is met and `npm run verify` is green. Dates and tasks: docs/11_TEAM_SCHEDULE.md.

- [x] Day 1 setup, repo, database, migration, seed, CI (plan D1)
- [ ] 2 auth backend (plan D2)                          - [ ] 3 test helpers, lookups, skills (plan D3 backend)
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

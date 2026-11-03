---
description: Begin a plan day safely (read context, propose plan, wait for go)
---
# Start of day
1. Ask the human for the calendar day number and their ROLE (BACKEND or FRONTEND) if not given.
2. Read `AGENTS.md`, `docs/PROGRESS.md`, your role's progress file, today's row in `docs/11_TEAM_SCHEDULE.md`, then ONLY your part of the named plan day in `docs/10_DAILY_PLAN.md` and the docs under "Read first".
3. Run `git status` and `npm run verify`; report the baseline (must be green before new work).
4. Propose a plan: files to create or change, tests to write, manual checks. List open questions.
5. STOP and wait for the human to say "go".

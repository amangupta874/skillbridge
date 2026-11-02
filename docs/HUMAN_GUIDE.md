# HUMAN_GUIDE: how to run this project with Antigravity (for you, not for the agent)

## One-time setup
1. Install Node 22, PostgreSQL 16 (or Docker), Git. Open this folder in Antigravity as the workspace. Confirm the files `AGENTS.md`, `.agent/rules/`, `.agent/workflows/` and `docs/` are present.
2. In Antigravity's Customizations/Rules panel check that the project rules are listed. If your version expects `.agents/` (plural) instead of `.agent/`, copy the two folders to the name it shows.
3. Settings that keep you safe: use the agent-assisted/planning mode where the agent shows a plan first; set terminal commands to "request review" (or an allow-list for `npm`, `npx`, `git`, `psql`), and never allow deleting outside the workspace.
4. Create the GitHub repository (public) and the two local databases (`skillbridge_dev`, `skillbridge_test`).

## Daily routine (about 4 to 6 hours of your time per day)
1. New chat -> prompt 2 (Start of day). Read the plan; correct it if wrong; say "go" (prompt 3).
2. While it works: watch the terminal output; if the agent asks a question, answer it and make it write the answer to PROGRESS.md "Decisions".
3. When it finishes: run `npm run verify` yourself. Then run the manual checks it listed (browser or Thunder Client). Do not trust "it works" without seeing it.
4. Fresh chat -> prompt 6 (Review). Fix what it finds. Commit and push. CI must be green.
5. Spend 20 minutes reading the code of the day with prompt 7. Your teammate reviews the pull request. You both MUST be able to explain every module in the code defence.

## Rules that save you from agent failures
- One day, one scope. Do not let the agent "also add" features. Anything not in docs/01 is out of scope.
- If the agent starts an unrelated refactor, stop it. If a test fails, fix the code, never delete or weaken the test.
- Keep chats short; start a new chat each day (the docs carry the memory, not the chat).
- If the agent upgrades a package major version, reject it (see docs/02 pinned versions).
- Commit at least twice per day. If a day goes badly: `git reset --hard` to the last good commit and retry with a narrower prompt.
- Never paste real secrets into the chat. `.env` files stay local.

## Division of work with your teammate (suggested)
Person A: owns backend days (database, services, tests). Person B: owns frontend days. Swap reviewers daily. Both run prompts 6 and 7 on the other person's work.
Agree the API contracts (docs/05) before coding in parallel; the docs are the contract.

## What I verified in the pack and what you must verify
Verified in my sandbox: the root `npm run verify` (lint, 14 server tests, 3 client tests, client build) passes; the raw SQL constraints and the partial unique index reject bad data on PostgreSQL 16;
the row-lock approach prevents over-filling a team (and shows the race without it); the pinned versions install and work together; the matching function returns 53 for the worked example.
NOT verified (the sandbox could not download Prisma's engine files): `prisma generate`, `prisma migrate`, the seed script and all Prisma-based services. Day 1 verifies these on your machine.
If Day 1 shows a Prisma error, paste it to the agent with prompt 4.

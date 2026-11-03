# PROMPTS: copy these into Antigravity (the human uses this file)

Always start each chat/task with the "Start of day" prompt. One agent, one day at a time. Review the plan the agent proposes BEFORE it writes code.

## 1. First message of the project (Day 1, each person once; say your role)
```
My role is ROLE (BACKEND or FRONTEND). You are my engineer for SkillBridge. Read AGENTS.md completely, then every file in docs/ in numeric order, then docs/PROGRESS.md.
Do not write code yet. Reply with: (1) a 10-line summary of the product and stack in your own words, (2) the 8 rules from AGENTS.md you consider most
important, (3) anything in the docs that is ambiguous, contradictory or missing, (4) your plan for Day 1 from docs/10_DAILY_PLAN.md as a checklist.
Wait for my approval before starting.
```

## 2. Start of day (replace N and ROLE; use BACKEND or FRONTEND)
```
My role is ROLE. Today is calendar day N. Read AGENTS.md, docs/PROGRESS.md, my role's progress file, today's row in docs/11_TEAM_SCHEDULE.md,
then ONLY my part of the plan day it names in docs/10_DAILY_PLAN.md and the docs listed under "Read first".
Propose a short implementation plan (files you will create or change, tests you will write, how you will verify manually). Do not code until I say "go".
Only my role's folder and today's scope. If something is unclear or the docs conflict, ask me instead of guessing.
```

## 3. Go
```
Go. Implement the plan. Write code and tests together, run `npm run verify`, fix every failure at the root cause, then update docs/PROGRESS.md and commit
with Conventional Commits. Finish with a report: what you built, what you ran and the results, what is still open, and the exact manual checks I should do.
```

## 4. Fix a failing test or bug
```
This is failing: <paste the full error output / describe the bug and steps>. First find the root cause and explain it in 3 sentences. Then fix it with the smallest
correct change, add a test that would have caught it, run `npm run verify`, and update docs/PROGRESS.md. Do not change unrelated code or weaken any test.
```

## 5. Agent seems to have forgotten the rules (context reset)
```
Stop. Re-read AGENTS.md and docs/PROGRESS.md now. List which of these you were about to violate or already violated: layering, derived data stored, authorisation in the service,
transaction + row lock for accepting, response and error formats, no new dependencies, tests with every change. Fix any violation, then continue.
```

## 6. Review before I merge (use at the end of each day, ideally in a fresh chat)
```
Review the changes of today (git diff main...HEAD). Check against AGENTS.md and docs/05, 06, 08. Report only real problems, with file and line:
security (authorisation, leaks, validation), business-rule bugs, missing tests, layering violations, N+1 queries, unhandled error cases, accessibility problems in the UI.
Do not rewrite working code for style. Then list the 5 most important things I should be able to explain in the code defence about today's work.
```

## 7. Explain for the code defence
```
Explain <file or function> as if I must defend it to a professor tomorrow: what it does, why it is designed this way, what would break without it, and 3 likely questions with short answers.
```

## 8. Demo / deployment day helper
```
Follow docs/09_DEPLOYMENT.md. Walk me through each step, ask me for values you need (never invent hostnames or secrets), run the release checklist, and record the live URLs and results in docs/PROGRESS.md.
```

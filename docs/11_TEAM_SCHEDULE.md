# 11. Team schedule: two people in parallel (calendar days 1 to 31 = 26 Oct to 25 Nov 2026)

BACKEND person = Person A (owns the GitHub repository). FRONTEND person = Person B (works from a fork). Swap roles if you prefer; keep one role per person.
"plan D#" points to the task description in `10_DAILY_PLAN.md`; do only YOUR part of it (backend = server/ work, frontend = client/ work).
Backend merges its work by the end of its day; frontend wires to that real API the NEXT day and uses sample data (shaped like docs/05) until then.
This schedule finishes about ten days before 25 Nov; those days are your safety buffer. If you fall behind, use them; do not add features.

| Day | Date | Person A: BACKEND | Person B: FRONTEND |
|---|---|---|---|
| 1 | Mon 26 Oct | plan D1: create repo, push pack, databases, migration + extra SQL, seed, CI, add B as collaborator | fork, clone, install, run `npm run verify`, create local databases, pull A's migration |
| 2 | Tue 27 Oct | plan D2: auth backend + tests | plan D3 client: api client, AuthProvider, ProtectedRoute, layouts, shared components |
| 3 | Wed 28 Oct | plan D3 backend: test helpers, lookups, skills + tests | plan D4 client: login and register pages + client tests (auth API merged yesterday) |
| 4 | Thu 29 Oct | plan D4 backend: `GET /users/:id`, `GET /users` + tests | dashboard shell, navbar, public profile page (sample data, wire next day) |
| 5 | Fri 30 Oct | plan D5 backend: PATCH me, PUT skills, PUT learning goals + tests | plan D5 client: SkillPicker + edit profile page |
| 6 | Sat 31 Oct | plan D6: managed database + API deployment | plan D6: frontend deployment + `/api` rewrite; both test register and login on the live URL |
| 7 | Sun 1 Nov | review each other's pull requests, fix leftovers | same |
| 8 | Mon 2 Nov | plan D8: projects backend + tests | ProjectCard, ProjectFilters, Pagination components with sample data |
| 9 | Tue 3 Nov | plan D11: applications backend (apply, withdraw, lists) | plan D9: discovery page + project detail wired to the real API |
| 10 | Wed 4 Nov | plan D12: deciding with row lock + the Promise.all test (most important day) | plan D10: project form + my projects |
| 11 | Thu 5 Nov | plan D15: exchanges backend + tests | plan D13: applications UI (apply dialog, my applications, owner review queue) |
| 12 | Fri 6 Nov | plan D17: matching backend + tests | plan D16: exchanges UI + people search |
| 13 | Sat 7 Nov | plan D19 backend: notifications | plan D18: matching UI (score and reasons) |
| 14 | Sun 8 Nov | plan D20 backend: analytics endpoint; redeploy API | plan D19 client: notification bell + page; redeploy frontend |
| 15 | Mon 9 Nov | plan D22: backend hardening (negative tests for every endpoint) | plan D20 client: dashboard + trends page |
| 16 | Tue 10 Nov | plan D25: session cleanup, logging review, EXPLAIN notes, npm audit | plan D23: frontend polish (states, mobile, confirm dialogs) |
| 17 | Wed 11 Nov | plan D26: demo seed script, concurrency demo script, demo script doc | plan D24: accessibility + core client tests |
| 18 | Thu 12 Nov | both: full regression on the live URL; log every defect in docs/PROGRESS.md | same |
| 19 | Fri 13 Nov | fix backend defects; review B's pull requests | fix frontend defects; review A's pull requests |
| 20 | Sat 14 Nov | API docs, deployment notes, final production config | plan D27: README, screenshots, diagrams |
| 21 | Sun 15 Nov | FEATURE FREEZE. Bug fixes only from now on. Redeploy | same |
| 22 | Mon 16 Nov | second full regression on live; fix defects | same |
| 23 | Tue 17 Nov | backlog bugs; apply teacher feedback if any | same |
| 24 | Wed 18 Nov | run the security-review workflow; final production config check | check the site on a phone; copy and layout review |
| 25 | Thu 19 Nov | write the server part of `docs/CODE_TOUR.md` | write the client part of `docs/CODE_TOUR.md` |
| 26 | Fri 20 Nov | explain your modules to B; practise viva questions | explain your modules to A; practise viva questions |
| 27 | Sat 21 Nov | demo rehearsal 1 on the live URL (both) | same |
| 28 | Sun 22 Nov | bug fixes only; redeploy; tag `v1.0.0-rc` | same |
| 29 | Mon 23 Nov | demo rehearsal 2; fresh-clone test following the README (both) | same |
| 30 | Tue 24 Nov | plan D31: `pg_dump` backup, grep git history for secrets, warm the service | final checks of the live UI |
| 31 | Wed 25 Nov | critical fixes only; nothing new. Submit | same |

## Git workflow with a fork (both of you)
One-time: A creates the public repo and pushes the pack; A adds B as a collaborator (Settings > Collaborators) so B can merge A's pull requests.
B forks A's repo, clones the FORK, and adds A's repo as `upstream`:
```
git clone https://github.com/B-USERNAME/skillbridge.git && cd skillbridge
git remote add upstream https://github.com/A-USERNAME/skillbridge.git
git remote -v        # origin = B's fork, upstream = A's repo
```
Every morning (B uses `upstream`, A uses `origin`):
```
git checkout main
git pull upstream main          # A: git pull origin main
git checkout -b feature/<role>-<topic>      # example: feature/frontend-login-pages
```
Work with Antigravity, then: `npm run verify`, `git add .`, `git commit -m "feat: ..."`, `git push origin feature/<role>-<topic>`.
Then on GitHub click "Compare and pull request" (B's pull request goes to A's repo, base = main). CI must be green.
The OTHER person reviews (Files changed tab), then merges. After every merge both run the morning commands again.
Rules: never work directly on `main`; backend touches only `server/`, frontend only `client/`; one pull request per day per person; merge before you start the next day.
Merge conflict: ask the agent "resolve the merge conflicts keeping both sides' intent, then run npm run verify".

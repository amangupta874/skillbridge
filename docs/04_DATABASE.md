# 04. Database

Source of truth: `server/prisma/schema.prisma` (18 tables, normalised to 5NF) plus `server/prisma/extra-constraints.sql`.
Do not add, rename or remove tables or columns without asking the human. The design document proves the normal forms; changes can break that proof.

## Tables
| Table | Purpose | Key facts |
|---|---|---|
| users | account + profile text | email unique (lower case), `password_hash`, optional `college_id` |
| colleges, skill_categories, project_categories, interests | lookups | unique `name` |
| user_links | GitHub / LinkedIn / portfolio / other | PK (user_id, link_type) |
| sessions | server-side sessions | PK = SHA-256 hash of cookie token; `expires_at` |
| skills, skill_aliases | skill catalogue | alias is lower case and unique across all skills |
| user_skills | skills a user knows + level | PK (user_id, skill_id) |
| user_learning_goals, user_interests | what a user wants to learn / likes | PK (user_id, skill_id) / (user_id, interest_id) |
| projects | project data | owner, category, difficulty, status, `max_team_size` (includes owner) |
| project_skills | required skills + `min_level` | PK (project_id, skill_id) |
| project_applications | request to join | UNIQUE (project_id, applicant_id) |
| project_members | team members EXCLUDING the owner | PK (project_id, user_id) |
| skill_exchanges | exchange requests | sender, recipient, offered skill, requested skill |
| notifications | in-app alerts | exactly one of `application_id` / `exchange_id` |

## Normalisation contract (do not violate)
No stored derived data: no team size, no FULL status, no notification text, no project id on notifications, no `decided_by`, no match score.
Multi-valued facts (skills, goals, interests, links) are always rows in their own tables, never arrays or comma-separated strings.
Lookup values (college, category names) are referenced by foreign key, never copied as text.

## First migration (Day 1), exact steps
```
cd server
cp .env.example .env && cp .env.test.example .env.test       # edit the passwords
npx prisma generate
npx prisma migrate dev --name init --create-only             # creates prisma/migrations/<timestamp>_init/migration.sql, does not apply
# open that migration.sql and APPEND the whole content of prisma/extra-constraints.sql at the END of the file
npx prisma migrate dev                                       # applies it to skillbridge_dev
npm run db:seed                                              # loads skills (74), categories, interests, project categories
# test database:
npx dotenv -e .env.test -- npx prisma migrate deploy
```
Verify in psql: `\d projects` shows `chk_team_size`; `\d skill_exchanges` shows `chk_not_self` and index `uq_active_exchange`; `\d notifications` shows `chk_one_target`;
`SELECT * FROM skill_demand_supply LIMIT 3;` works. These SQL rules were verified on PostgreSQL 16 (each rejects bad data).
After any schema change: new migration with `npx prisma migrate dev --name <what_changed>`, then `npx prisma generate`. Never edit an applied migration.

## Prisma usage rules and pitfalls
- Composite key lookups use the generated name: `where: { userId_skillId: { userId, skillId } }`, `{ projectId_applicantId: {...} }`.
- Interactive transactions: `prisma.$transaction(async (tx) => { ... })`; use `tx` for EVERY query inside. Keep them short.
- Row lock inside a transaction: ``await tx.$queryRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE` `` (tagged template = parameterised, safe).
- Never use `$queryRawUnsafe`/`$executeRawUnsafe` with user input. The only allowed unsafe call is the constant TRUNCATE in test helpers.
- Unique violation = Prisma error `P2002` (the error handler maps it to 409). Missing record on update/delete = `P2025` (maps to 404).
- Seats: `const project = await prisma.project.findUnique({ where, include: { _count: { select: { members: true } } } }); seatsTaken = 1 + project._count.members`.
- List queries: always `select` only the fields the DTO needs; paginate with `skip/take` and a separate `count` with the same `where`; sort has a stable tiebreaker (`createdAt desc, id asc`).
- Case-insensitive search: `{ contains: text, mode: 'insensitive' }`.
- Replacing a user's skills: inside one transaction `deleteMany` for the user, then `createMany` the new rows.
- Resolving skill names: lower-case + trim, look in `skills.name` (case-insensitive) then `skill_aliases.alias`. The API itself accepts skill IDs; names are only a UI convenience.

## Seed data
`prisma/seed-data/catalogue.json`: 9 skill categories, 74 skills with aliases (no name/alias collisions), 10 project categories, 14 interests, 1 college ("Other / Not listed").
`seed.js` is idempotent (upsert). Demo users/projects for the live demo come from a SEPARATE script `prisma/seed-demo.js` (Day 28): 6 users, 5 projects,
some applications and exchanges. Demo password is read from an env var, never hard-coded in the repo's documentation.

## Indexes already in the schema
users(email unique); sessions(user_id), (expires_at); projects(status, category_id), (owner_id); project_skills(skill_id); user_skills(skill_id);
user_learning_goals(skill_id); project_applications(project_id, status), (applicant_id); project_members(user_id);
skill_exchanges(recipient_id, status), (sender_id, status); notifications(recipient_id, is_read, created_at).
Day 29: run `EXPLAIN ANALYZE` on the project list and matching pre-filter queries, save the output in `docs/performance-notes.md` (used in the viva).

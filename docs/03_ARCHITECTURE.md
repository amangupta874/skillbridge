# 03. Architecture and code conventions

## Shape
Three tiers: React SPA, Express REST API (layered modular monolith), PostgreSQL. The browser never talks to the database.
Request pipeline (already wired in `server/src/app.js`):
`helmet > cors > pino-http (request id) > express.json (100kb) > cookieParser > originCheck > /api router > 404 > errorHandler`.
Inside a module router: `[authLimiter] > [requireAuth] > validate(schema) > controller > service > prisma`.

## Repository layout (target)
```
skillbridge/
  AGENTS.md  package.json  eslint.config.js  .prettierrc  .gitignore  .nvmrc  README.md
  .agent/rules/*.md  .agent/workflows/*.md   docs/*.md   .github/workflows/ci.yml
  server/
    package.json  vitest.config.js  .env.example  .env.test.example
    prisma/  schema.prisma  extra-constraints.sql  seed.js  seed-data/catalogue.json  migrations/
    tests/helpers.js                      shared test helpers (reset db, factories, login)
    src/
      app.js server.js routes.js          (exist) routes.js mounts every module router
      config/    env.js logger.js prisma.js              (exist)
      middleware/ errorHandler.js validate.js requireAuth.js originCheck.js rateLimiters.js   (exist)
      utils/     errors.js respond.js token.js           (exist)  + add small helpers only when needed
      modules/
        auth/ users/ skills/ lookups/ projects/ applications/ exchanges/ matching/ notifications/
        each: <name>.routes.js <name>.schema.js <name>.controller.js <name>.service.js <name>.test.js
        matching/scoreCandidate.js (+ test) exists
  client/
    package.json vite.config.js index.html .env.example
    src/ main.jsx App.jsx index.css
      api/        client.js (axios) + one file per feature: auth.js projects.js ...
      features/   auth/ profile/ projects/ applications/ exchanges/ matching/ notifications/ dashboard/ skills/
                  (each: components, hooks (TanStack Query), small helpers)
      components/ shared UI: Button, Input, Select, Card, Badge, Spinner, EmptyState, ErrorBanner, Modal, Pagination, SkillBadge, SkillPicker
      layouts/    AppLayout.jsx (navbar + outlet) AuthLayout.jsx
      pages/      one file per route
      routes/     AppRoutes.jsx ProtectedRoute.jsx
      hooks/ utils/ test/
```

## Layer contracts
| Layer | Does | Must not |
|---|---|---|
| routes | URL + method + middleware chain | contain logic |
| schema | zod schema `z.object({ body, query, params })` | query the database |
| controller | read `req.valid` / `req.user`, call ONE service function, `sendData(res, result, status)` | touch Prisma, contain rules |
| service | rules, authorisation, transactions, Prisma queries, return plain objects shaped as the API DTOs | use `req`/`res` |
| errors | throw helpers from `utils/errors.js` | build error JSON manually |

## Canonical module example (copy this shape for every module)
```js
// modules/skills/skills.routes.js
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { searchSkillsSchema } from './skills.schema.js';
import { searchSkills } from './skills.controller.js';

export const skillsRoutes = Router();
skillsRoutes.get('/', requireAuth, validate(searchSkillsSchema), searchSkills);
```
```js
// modules/skills/skills.schema.js
import { z } from 'zod';

export const searchSkillsSchema = z.object({
  body: z.any().optional(),
  params: z.object({}).optional(),
  query: z.object({
    query: z.string().trim().max(50).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});
```
```js
// modules/skills/skills.controller.js
import * as skillsService from './skills.service.js';
import { sendData } from '../../utils/respond.js';

export async function searchSkills(req, res) {
  const skills = await skillsService.searchSkills(req.valid.query);
  sendData(res, skills);
}
```
```js
// modules/skills/skills.service.js
import { prisma } from '../../config/prisma.js';

export function searchSkills({ query, categoryId, limit }) {
  const textFilter = query
    ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { aliases: { some: { alias: { contains: query.toLowerCase() } } } }] }
    : {};
  return prisma.skill.findMany({
    where: { ...(categoryId && { categoryId }), ...textFilter },
    select: { id: true, name: true, category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
    take: limit,
  });
}
```
Mount in `routes.js`: `apiRouter.use('/skills', skillsRoutes);`. Because Express 5 forwards async errors, controllers need no try/catch.

## Naming and style
Files: camelCase for JS (`applications.service.js`), PascalCase for React components (`ProjectCard.jsx`). Functions are verbs (`decideApplication`).
Booleans start with `is/has/can`. No abbreviations except `id`, `url`. Max function length about 40 lines; split otherwise.
Services return plain objects in the DTO shapes of `05_API_SPEC.md`; build them with small mapper functions (`toProjectListItem(project)`) in the same module.
Imports always include the `.js` extension on the server (ES modules).

## Test helpers (`server/tests/helpers.js`), create on Day 3
```js
import request from 'supertest';
import { prisma } from '../src/config/prisma.js';
import { app } from '../src/app.js';

const ALL_TABLES = ['notifications', 'skill_exchanges', 'project_members', 'project_applications', 'project_skills', 'projects',
  'user_interests', 'user_learning_goals', 'user_skills', 'user_links', 'sessions', 'skill_aliases', 'skills', 'skill_categories',
  'interests', 'project_categories', 'users', 'colleges'];

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${ALL_TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

let userCounter = 0;
// Registers a new user through the real API and returns a supertest agent that keeps the session cookie.
export async function registerUser(overrides = {}) {
  userCounter += 1;
  const credentials = { fullName: `Test User ${userCounter}`, email: `user${userCounter}@example.com`, password: 'Password123', ...overrides };
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').send(credentials);
  return { agent, user: response.body.data, credentials };
}

export async function createSkill(name, categoryName = 'Test Category') {
  const category = await prisma.skillCategory.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } });
  return prisma.skill.upsert({ where: { name }, update: {}, create: { name, categoryId: category.id } });
}

export async function createProjectCategory(name = 'Web Development') {
  return prisma.projectCategory.upsert({ where: { name }, update: {}, create: { name } });
}
```
Every integration test file starts with `beforeEach(resetDatabase)` and ends with `afterAll(() => prisma.$disconnect())`.
`vitest.config.js` already sets `fileParallelism: false` because all files share one test database.

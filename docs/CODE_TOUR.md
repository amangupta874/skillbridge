# Server code tour

The server is a JavaScript ES-module app built with Express 5 and Prisma 6. `server/src/routes.js` mounts the feature routers under `/api`; each feature separates routes, Zod schemas, HTTP controllers, and services. Controllers read validated input and the authenticated user, then call services. Services own authorization, business rules, database reads/writes, and transactions.

## Shared request path

`server/src/app.js` installs Helmet, credentialed CORS, request-id logging, JSON parsing, cookie parsing, the origin check, the `/api` router, and the final 404/error handler. `server/src/middleware/requireAuth.js` hashes the incoming `sid` token and loads its server-side session and user. `validate.js` stores parsed body/query/params on `req.valid`. `utils/respond.js` builds success and paginated response envelopes; `utils/errors.js` provides `AppError` helpers for the central error handler.

`server/src/config/env.js` validates environment variables. `config/prisma.js` owns the Prisma client. `config/logger.js` configures Pino redaction. `server.js` starts the HTTP server, cleans expired sessions at startup and every six hours, and handles graceful shutdown.

## Feature modules

### Auth — `server/src/modules/auth/`

- **Purpose:** register and log in students, expose the current user, and log out a session.
- **Key files/functions:** `auth.routes.js` applies the rate limiter and authentication middleware; `auth.schema.js` validates credentials; `auth.controller.js` sets and clears the cookie; `auth.service.js` implements `register`, `login`, `logout`, and `sessionCookieOptions`.
- **Design decision:** the browser receives a random session token, while the database stores only its SHA-256 hash. This lets the server expire or revoke sessions without exposing a stored bearer token.

### Lookups — `server/src/modules/lookups/`

- **Purpose:** return project categories, skill categories, interests, and colleges for forms.
- **Key files/functions:** `lookups.routes.js`, `lookups.schema.js`, `lookups.controller.js`, and `lookups.service.js:getLookups`.
- **Design decision:** the service loads the four independent catalogue lists together with `Promise.all`; lookup values remain normalized reference rows.

### Skills — `server/src/modules/skills/`

- **Purpose:** search the skill catalogue by name, alias, and category for profile/project forms.
- **Key files/functions:** `skills.schema.js:searchSkillsSchema`, `skills.controller.js:searchSkills`, and `skills.service.js:searchSkills`.
- **Design decision:** aliases are searched alongside canonical names, so alternate spellings resolve to the same skill row rather than creating duplicate skills.

### Users — `server/src/modules/users/`

- **Purpose:** show public profiles, list people, and replace the caller's profile, skills, and learning goals.
- **Key files/functions:** `users.schema.js` defines limits; `users.controller.js` handles the five routes; `users.service.js` uses `toUserPublic`, `toUserCard`, `updateProfile`, `updateSkills`, and `updateLearningGoals`.
- **Design decision:** updating links/interests or skills/goals validates references and replaces each set inside a transaction, so callers do not see a half-updated profile. Public DTOs omit email.

### Projects — `server/src/modules/projects/`

- **Purpose:** create, discover, read, and update projects and return computed team details.
- **Key files/functions:** `projects.schema.js` validates fields and filters; `projects.routes.js` mounts project and matching paths; `projects.controller.js` delegates; `projects.service.js` contains `createProject`, `listProjects`, `getProject`, `updateProject`, `toProjectListItem`, and `toProjectDetail`; `transitions.js` contains the project status table.
- **Design decision:** `seatsTaken`, `seatsLeft`, `isFull`, `myRole`, and `myApplication` are calculated in DTO mapping. They are not stored as columns that can become stale.

### Applications — `server/src/modules/applications/`

- **Purpose:** apply, reopen a withdrawn application, list applications, withdraw, accept, or reject.
- **Key files/functions:** `applications.schema.js` validates message/status/pagination; `applications.controller.js` handles routes; `applications.service.js` implements `applyToProject`, list functions, `withdrawApplication`, `decideApplication`, and `changeApplicationStatus`; `transitions.js` describes actor-specific transitions.
- **Design decision:** `decideApplication` locks the project row with `SELECT ... FOR UPDATE`, then rereads the application and team count inside the same transaction. Concurrent decisions for the last seat serialize; after the first commits, the next request sees the full team and gets 409.

### Skill exchanges — `server/src/modules/exchanges/`

- **Purpose:** create and list peer skill exchange proposals and enforce their state changes.
- **Key files/functions:** `exchanges.schema.js`, `exchanges.routes.js`, `exchanges.controller.js`, `exchanges.service.js:createExchange`, `listExchanges`, `changeExchangeStatus`, and `transitions.js`.
- **Design decision:** a partial unique PostgreSQL index permits only one PENDING/ACCEPTED exchange for the same sender, recipient, and skill pair. The database resolves concurrent duplicate requests; the service maps the unique conflict to 409.

### Matching — `server/src/modules/matching/`

- **Purpose:** rank possible project teammates for a project owner and explain the ranking.
- **Key files/functions:** `matching.routes.js`, `matching.schema.js`, `matching.controller.js`, `matching.service.js:getMatchesForProject`, and `scoreCandidate.js:scoreCandidate`.
- **Design decision:** candidate skill and learning-goal rows are loaded in bulk before scoring, instead of issuing a query for each candidate. The scoring function is pure JavaScript and has unit tests independent of HTTP and Prisma.

### Notifications — `server/src/modules/notifications/`

- **Purpose:** list the caller's notifications, count unread notifications, and mark one or all as read.
- **Key files/functions:** `notifications.routes.js` registers `/read-all` before `/:id/read`; `notifications.schema.js` validates filters and IDs; `notifications.controller.js` handles response envelopes; `notifications.service.js` implements listing, counts, read actions, and `toNotification`.
- **Design decision:** the database stores a notification type and a reference to its application or exchange. `toNotification` joins the related rows and renders `message` and `link` at read time, avoiding copied text that could become stale.

## Shared constraints and tests

`server/prisma/schema.prisma` defines 18 relational tables and foreign keys. `server/prisma/extra-constraints.sql` adds PostgreSQL checks, a partial unique exchange index, the one-target notification check, and the `skill_demand_supply` view. The view exists in the database, but no analytics HTTP route is currently mounted.

`server/tests/helpers.js` refuses to truncate a database URL that does not contain `test`, resets the integration-test tables, and provides helpers that register users through the real HTTP app. Server module tests use Supertest against PostgreSQL; `server/vitest.config.js` runs files serially because they share one test database. `scoreCandidate.test.js` and the `transitions.test.js` files exercise pure rules. Client tests use Vitest and Testing Library.

## Questions for the code defence

1. **How does the schema approach fifth normal form?** Independent multi-valued facts are represented in separate relations: user skills, learning goals, interests, links, project skills, and memberships each have their own tables and keys. This avoids storing lists or repeating facts in a user/project row. The design notes describe this as the schema's 5NF normalization decision.

2. **Why does application acceptance lock the project row? What happens without the lock?** The lock makes accepts for the same project take turns before checking available seats. Without it, two transactions can both read the same last seat as free and both add a member, exceeding capacity.

3. **Why use server-side sessions instead of JWTs?** Sessions are simple to revoke and expire centrally. The cookie carries a random token, while the database stores only its SHA-256 hash and expiry; the API resolves each request against that row.

4. **Why PostgreSQL?** The product depends on relational foreign keys, unique constraints, transactions, partial indexes, and `SELECT ... FOR UPDATE` for team capacity. PostgreSQL provides these integrity and concurrency tools directly.

5. **Where is authorization enforced?** `requireAuth` verifies identity in middleware. Each service then checks the relevant owner, applicant, member, sender, recipient, or notification recipient before reading or changing protected data. Hiding a button is only a UI convenience.

6. **Which values are derived rather than stored?** Team seats and full status are computed from the owner plus member rows; match scores are calculated per request; unread counts are counted from notifications; notification text and links are rendered from their type and referenced rows.

7. **How is the teammate match score calculated?** `scoreCandidate` combines coverage (60%), proficiency (20%), gap fill (10%), and learning alignment (10%). It creates reasons from the matched skills, excludes the owner and current members, drops zero-score results, and sorts by score then name. The score is a ranking aid, not a probability.

8. **How do the state machines work?** `transitions.js` files list allowed next statuses and the actor allowed to make each change. Services check the table and return 409 for an illegal transition; response DTOs use the same tables to populate `allowedTransitions`.

9. **Where are transactions used?** Profile replacement keeps related updates together; project creation/update keeps required-skill rows with the project; application decisions keep membership, application status, and notification together; exchange changes keep status and notification together. A failed transaction rolls back all of its writes.

10. **How are errors and logs handled?** Services throw `AppError` helpers. The central Express error handler maps validation, known Prisma, body-size, and application errors to JSON; unknown errors return a generic 500 and are logged. Pino request logs include request IDs and redact cookies, authorization headers, set-cookie, and request passwords.

11. **How are server behaviors tested?** Vitest and Supertest exercise the real Express app against a separate PostgreSQL test database. Shared helpers guard destructive resets. Tests run serially because they share that database; pure matching and transition logic also has unit tests. Client behavior uses Vitest and Testing Library.

12. **How is the app deployed?** Vercel serves the React client and rewrites `/api/*` to the Render Express service. Render applies Prisma migrations at build time and connects to PostgreSQL on Neon. GitHub Actions provisions PostgreSQL 16 and runs generate, migrations, lint, tests, and build for pull requests and main pushes.

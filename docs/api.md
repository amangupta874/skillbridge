# SkillBridge API reference

This reference follows the mounted Express routes and their Zod schemas in `server/src/modules/`. The API base path is `/api`; requests and responses use JSON unless the response is `204 No Content`.

## Shared rules

- Every endpoint requires a valid `sid` session cookie except `GET /health`, `POST /auth/register`, and `POST /auth/login`.
- Authenticated browser requests include credentials. Requests that change state are checked against `CLIENT_ORIGIN` when they include an `Origin` header; a different origin returns 403 `FORBIDDEN`. Login and registration are rate limited.
- Schemas validate request bodies, query strings, and path parameters. Object schemas strip unknown fields. Pagination defaults to `page=1`, `limit=12`; list limits are at most 50 unless a route below says otherwise.
- A success response is `{ "data": value }`. A paginated list is `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`. `totalPages` is at least 1, including for an empty list.
- Errors use `{ "error": { "code": "...", "message": "...", "details"?: ... } }`. Validation details use keys such as `body.email` and `query.limit`. `details` is omitted when there are no details.
- Common errors are 400 `VALIDATION_ERROR` / `BAD_REQUEST`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT` / `DUPLICATE`, 413 `PAYLOAD_TOO_LARGE`, 429 `RATE_LIMITED`, and 500 `INTERNAL_ERROR`. The 500 response is generic; server logs carry the underlying error.

## Endpoints

### Health and authentication

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `GET /health` | Public | None | `200 { data: { status: "ok" } }`; runs a database query | `500 INTERNAL_ERROR` if an unexpected database error occurs |
| `POST /auth/register` | Public; rate limited | Body: `fullName` trimmed, 2–80 chars; `email` valid email; `password` 8–72 chars with a letter and digit | `201 { data: { id, email, fullName } }`; sets `sid` cookie | `400 VALIDATION_ERROR`, `409 DUPLICATE` for existing email, `429 RATE_LIMITED` |
| `POST /auth/login` | Public; rate limited | Body: `email` valid email, `password` non-empty | `200 { data: { id, email, fullName } }`; sets `sid` cookie | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` with the same `Invalid email or password` message for unknown email or wrong password, `429 RATE_LIMITED` |
| `POST /auth/logout` | Session required | No body | `204`; deletes the current session and clears `sid` | `401 UNAUTHORIZED` |
| `GET /auth/me` | Session required | None | `200 { data: { id, email, fullName } }` | `401 UNAUTHORIZED` for absent or expired session |

### Lookups, skills, and users

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `GET /lookups` | Session required | No fields | `200 { data: { projectCategories, skillCategories, interests, colleges } }`; each list has `{ id, name }` rows | `401 UNAUTHORIZED` |
| `GET /skills` | Session required | Query: `query` optional, max 50 chars; `categoryId` optional positive integer; `limit` default 50, 1–100 | `200 { data: [{ id, name, category: { id, name } }] }`, sorted by name; searches names and aliases | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `GET /users` | Session required | Query: `query` optional, max 100 chars; `skillId` optional positive integer; `page`; `limit` 1–50 | Paginated `UserCard[]`; excludes the caller | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `GET /users/:id` | Session required | `id` must be a UUID | `200 { data: UserPublic }`; profile includes skills, goals, interests, links, college and creation date, but no email | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND` |
| `PATCH /users/me` | Session required | At least one field: `fullName` 2–80; `bio` nullable, max 500; `weeklyHours` nullable, integer 1–80; `collegeId` nullable positive integer; `links` max 4 with unique `type` and HTTPS `url`; `interestIds` max 10 unique positive integers | `200 { data: UserPublic }`; supplied `links` and `interestIds` replace their sets | `400 VALIDATION_ERROR` or `BAD_REQUEST` for unknown college/interest ids, `401 UNAUTHORIZED` |
| `PUT /users/me/skills` | Session required | Body: `skills` array max 30 of `{ skillId: positive integer, level: BEGINNER\|INTERMEDIATE\|ADVANCED }`; skill ids unique; empty array clears the set | `200 { data: UserPublic }`; replaces all known skills | `400 VALIDATION_ERROR` or `BAD_REQUEST` for unknown ids or a skill also in learning goals; `401 UNAUTHORIZED`; `409 CONFLICT` if removing a skill offered in a pending/accepted exchange |
| `PUT /users/me/learning-goals` | Session required | Body: `skillIds` array max 15 of unique positive integers; empty array clears the set | `200 { data: UserPublic }`; replaces all learning goals | `400 VALIDATION_ERROR` or `BAD_REQUEST` for unknown ids or a skill also in known skills; `401 UNAUTHORIZED` |

`UserPublic` contains `{ id, fullName, bio, weeklyHours, college, links, skills, learningGoals, interests, createdAt }`. A user card contains `{ id, fullName, college, topSkills }`; `topSkills` is capped at three and ordered by level then name.

### Projects and matching

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `GET /projects` | Session required | Query: `query` max 100; `skillIds` comma-separated positive integers; `categoryId` positive integer; `difficulty` level enum; `status` OPEN/IN_PROGRESS/COMPLETED; `hasOpenSeats` true/false; `mine` owned/member; `sort` newest/oldest/seats (default newest); `page`; `limit` 1–50 | Paginated `ProjectListItem[]`. Without `mine`, status defaults to OPEN and DRAFT/ARCHIVED are excluded. Owned results can include all statuses; member results default to OPEN/IN_PROGRESS/COMPLETED. `seats` sorts by fewest seats remaining first. | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `POST /projects` | Session required | Body: `title` 5–100; `description` 20–2000; positive `categoryId`; `difficulty` level enum; `maxTeamSize` integer 2–10 including owner; optional `hoursPerWeek` 1–60; optional future ISO `deadline`; optional HTTPS `githubUrl`, `demoUrl`; `skills` 1–10 `{ skillId, minLevel }`; optional `status` DRAFT/OPEN (default DRAFT) | `201 { data: ProjectDetail }`; caller is owner | `400 VALIDATION_ERROR` or `BAD_REQUEST` for unknown skill ids; `401 UNAUTHORIZED`; `409 DUPLICATE` if duplicate project-skill rows violate a unique key |
| `GET /projects/:id` | Session required | `id` UUID | `200 { data: ProjectDetail }` | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND` for missing projects or another user's DRAFT |
| `PATCH /projects/:id` | Session required; owner only | `id` UUID. Body is a non-empty subset of create fields; status may be DRAFT/OPEN/IN_PROGRESS/COMPLETED/ARCHIVED. `skills`, when supplied, replaces all required skills. Same field limits as create. | `200 { data: ProjectDetail }` | `400 VALIDATION_ERROR` / `BAD_REQUEST` for unknown skill ids; `401 UNAUTHORIZED`; `403 FORBIDDEN` for non-owner; `404 NOT_FOUND`; `409 CONFLICT` for illegal status change, editing a completed/archived project, or reducing team size below current seats |
| `GET /projects/:id/matches` | Session required; owner only | `id` UUID; query `limit` default 20, 1–50 | `200 { data: MatchResult[] }`, score-descending then name; excludes owner and members | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND` |

`ProjectListItem` contains `{ id, title, summary, category, difficulty, status, maxTeamSize, seatsTaken, seatsLeft, isFull, skills, owner, createdAt }`. `ProjectDetail` adds the description, work hours, deadline, project links, member cards, `myRole`, and `myApplication`. Seat values are calculated from the owner plus project-member rows.

`MatchResult` contains `{ user: UserCard, score, breakdown: { coverage, proficiency, gapFill, learning }, reasons }`. Scores are integer ranking aids from 0 to 100, not probabilities.

### Applications

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `POST /projects/:id/applications` | Session required | `id` UUID; body `message` trimmed, 10–500 chars | `201 { data: Application }`; reopening a WITHDRAWN application changes it to PENDING | `400 VALIDATION_ERROR` or `BAD_REQUEST` when applying to own project; `401 UNAUTHORIZED`; `404 NOT_FOUND` for hidden/missing project; `409 CONFLICT` for non-OPEN project or an existing non-withdrawn application |
| `GET /projects/:id/applications` | Session required; project owner only | `id` UUID; query optional `status` enum PENDING/ACCEPTED/REJECTED/WITHDRAWN, `page`, `limit` 1–50 | Paginated `Application[]` with applicant cards and owner `allowedTransitions` | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND` |
| `GET /users/me/applications` | Session required | Query optional `status` enum, `page`, `limit` 1–50 | Paginated `Application[]` for the caller with applicant-role `allowedTransitions` | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `PATCH /applications/:id` | Session required | `id` UUID; body `status` ACCEPTED/REJECTED/WITHDRAWN | `200 { data: Application }`; owner may accept/reject; applicant may withdraw. Acceptance creates membership and a notification in the same row-locked transaction. | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN` for wrong owner, `404 NOT_FOUND` for missing application or non-applicant withdrawal, `409 CONFLICT` for already-processed application, full team, closed project acceptance, or illegal withdrawal |

`Application` contains `{ id, projectId, project: { id, title }, applicant: UserCard, message, status, createdAt, decidedAt, allowedTransitions }`.

### Skill exchanges

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `POST /exchanges` | Session required | Body: UUID `recipientId`; positive integer `offeredSkillId`, `requestedSkillId`; `message` trimmed, 10–500 chars | `201 { data: Exchange }`; creates EXCHANGE_RECEIVED notification in the same transaction | `400 VALIDATION_ERROR` or `BAD_REQUEST` for self-exchange or skills missing from the correct profile; `401 UNAUTHORIZED`; `404 NOT_FOUND` for unknown recipient; `409 CONFLICT` for an active duplicate |
| `GET /exchanges` | Session required | Query `box` incoming/outgoing/all (default all); optional status PENDING/ACCEPTED/REJECTED/CANCELLED/COMPLETED; `page`; `limit` 1–50 | Paginated `Exchange[]` involving the caller, with caller-specific `allowedTransitions` | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `PATCH /exchanges/:id` | Session required; participant only | `id` UUID; body `status` PENDING/ACCEPTED/REJECTED/CANCELLED/COMPLETED | `200 { data: Exchange }`; sends a notification for ACCEPTED, REJECTED, and COMPLETED | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN` when a participant is the wrong actor, `404 NOT_FOUND` for non-participant/missing exchange, `409 CONFLICT` for illegal state change |

`Exchange` contains `{ id, sender, recipient, offeredSkill, requestedSkill, message, status, createdAt, updatedAt, allowedTransitions }`. While PENDING, the recipient can accept/reject and the sender can cancel. Either participant can complete/cancel an ACCEPTED exchange.

### Notifications

| Method and path | Auth | Request | Success | Error cases |
|---|---|---|---|---|
| `GET /notifications` | Session required | Query `unread` true/false; `page`; `limit` 1–50 | Paginated `Notification[]`, newest first | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` |
| `GET /notifications/unread-count` | Session required | None | `200 { data: { count } }` for caller | `401 UNAUTHORIZED` |
| `PATCH /notifications/read-all` | Session required | No body | `200 { data: { updated } }`, the number marked read for caller | `401 UNAUTHORIZED` |
| `PATCH /notifications/:id/read` | Session required | `id` UUID; no body | `200 { data: Notification }`; marks caller's notification read | `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND` if missing or owned by another user |

`Notification` contains `{ id, type, isRead, createdAt, message, link }`. Message and link are rendered from the notification type and related application/exchange rows; they are not stored in the notification row. The schema accepts `unread=false`, but the current service applies an unread filter only for `unread=true`; `false` therefore returns all notifications.

## Short examples

Example response objects below are shortened to keep the examples small; fields omitted from a DTO are described above.

Register (the response also sets the `sid` cookie):

```http
POST /api/auth/register
Content-Type: application/json

{"fullName":"Ari Student","email":"ari@example.test","password":"Password123"}
```

```json
{"data":{"id":"<uuid>","email":"ari@example.test","fullName":"Ari Student"}}
```

Create a project with an authenticated session:

```http
POST /api/projects
Cookie: sid=<session-cookie>
Content-Type: application/json

{"title":"Campus planner","description":"A shared planner for student teams and events.","categoryId":1,"difficulty":"BEGINNER","maxTeamSize":3,"skills":[{"skillId":1,"minLevel":"BEGINNER"}],"status":"OPEN"}
```

```json
{"data":{"id":"<uuid>","title":"Campus planner","status":"OPEN","maxTeamSize":3,"seatsTaken":1,"seatsLeft":2,"isFull":false,"myRole":"OWNER","myApplication":null}}
```

Apply, then accept as the project owner:

```http
POST /api/projects/<project-uuid>/applications
Cookie: sid=<applicant-session>
Content-Type: application/json

{"message":"I would like to help build the planner."}
```

```json
{"data":{"id":"<application-uuid>","projectId":"<project-uuid>","status":"PENDING","allowedTransitions":["WITHDRAWN"]}}
```

```http
PATCH /api/applications/<application-uuid>
Cookie: sid=<owner-session>
Content-Type: application/json

{"status":"ACCEPTED"}
```

```json
{"data":{"id":"<application-uuid>","projectId":"<project-uuid>","status":"ACCEPTED","allowedTransitions":[]}}
```

## Differences from `docs/05_API_SPEC.md`

- The API spec describes `GET /api/analytics/skill-demand`, but there is no analytics router mounted in `server/src/routes.js`; the endpoint currently returns the generic 404 route error.
- The spec describes `details` as a required error-body field. The error handler includes `details` only when it is defined, so JSON responses omit it for errors without details.


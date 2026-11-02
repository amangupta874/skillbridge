# 05. REST API specification (final)

Base path `/api`. JSON in and out. All routes need a valid session cookie `sid` unless marked Public.
Success: `{ "data": ... }` (lists add `"meta": { "page", "limit", "total", "totalPages" }`). Error: `{ "error": { "code", "message", "details" } }`.
`details` for validation errors is `{ "body.email": ["Invalid email address"] }` (keys are `body.`, `query.` or `params.` + field).
Status codes: 200 ok, 201 created, 204 no content, 400 validation/invalid, 401 not logged in, 403 not allowed, 404 not found/hidden, 409 conflict, 413, 429, 500.
Error codes: VALIDATION_ERROR, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, DUPLICATE, RATE_LIMITED, PAYLOAD_TOO_LARGE, INTERNAL_ERROR.
Pagination query for lists: `page` (default 1), `limit` (default 12, max 50). Enum values are UPPER_CASE strings.
Use 404 (not 403) when revealing a resource's existence would leak information (other users' notifications, DRAFT projects, other people's exchanges).

## Shared DTOs
```
SkillRef        { id, name }
UserCard        { id, fullName, college: {id,name}|null, topSkills: [{ skill: SkillRef, level }]  (max 3, highest level first) }
UserPublic      { id, fullName, bio, weeklyHours, college, links: [{type,url}], skills: [{ skill: {id,name,category:{id,name}}, level }],
                  learningGoals: [SkillRef], interests: [{id,name}], createdAt }          // NEVER email
CurrentUser     { id, email, fullName }
ProjectListItem { id, title, summary (first 200 chars of description), category:{id,name}, difficulty, status, maxTeamSize,
                  seatsTaken, seatsLeft, isFull, skills: [{ id, name, minLevel }], owner: {id, fullName}, createdAt }
ProjectDetail   { ...ProjectListItem, description, hoursPerWeek, deadline, githubUrl, demoUrl,
                  members: [{ id, fullName, joinedAt }], myRole: "OWNER"|"MEMBER"|"NONE", myApplication: { id, status }|null }
Application     { id, projectId, project: {id,title}, applicant: UserCard, message, status, createdAt, decidedAt, allowedTransitions: ["ACCEPTED","REJECTED"] }
Exchange        { id, sender: {id,fullName}, recipient: {id,fullName}, offeredSkill: SkillRef, requestedSkill: SkillRef, message, status,
                  createdAt, updatedAt, allowedTransitions: [...] }     // allowedTransitions = what THE CALLER may do now
Notification    { id, type, isRead, createdAt, message, link }          // message and link are rendered by the server from type + referenced rows
MatchResult     { user: UserCard, score (0..100 int), breakdown: { coverage, proficiency, gapFill, learning }, reasons: [string] }
```
seatsTaken = 1 + member count; seatsLeft = maxTeamSize - seatsTaken; isFull = seatsLeft <= 0. All three are computed, never stored.

## Auth and account
| Endpoint | Body / query | Response | Rules |
|---|---|---|---|
| POST `/auth/register` (Public, rate limited) | `{ fullName 2..80, email, password 8..72 with a letter and a digit }` | 201 `CurrentUser` + sets cookie | email trimmed and lower-cased; duplicate = 409 `DUPLICATE`; password hashed (bcryptjs cost 12) |
| POST `/auth/login` (Public, rate limited) | `{ email, password }` | 200 `CurrentUser` + sets cookie | wrong email OR password = 401 "Invalid email or password" (same message) |
| POST `/auth/logout` | none | 204, clears cookie | deletes the session row |
| GET `/auth/me` | none | 200 `CurrentUser` | 401 if no/expired session |

## Lookups, skills, users
| Endpoint | Query / body | Response |
|---|---|---|
| GET `/lookups` | none | `{ projectCategories:[{id,name}], skillCategories:[{id,name}], interests:[{id,name}], colleges:[{id,name}] }` |
| GET `/skills` | `query?`, `categoryId?`, `limit` (default 50, max 100) | `[ { id, name, category:{id,name} } ]` sorted by name; matches name OR alias |
| GET `/users` | `query?` (name contains), `skillId?` (knows it), `page`, `limit` | paginated `UserCard`; excludes the caller |
| GET `/users/:id` | | `UserPublic`; 404 if unknown |
| PATCH `/users/me` | any of `fullName 2..80, bio ≤500 (nullable), weeklyHours 1..80 (nullable), collegeId (nullable), links [{type,url https}] (replaces all, max 4, one per type), interestIds [int] (replaces all, max 10)` | `UserPublic` |
| PUT `/users/me/skills` | `{ skills: [{ skillId, level }] }` (replaces all, max 30, no duplicate skillId) | `UserPublic`; 409 if removing a skill that is the offered skill of a PENDING/ACCEPTED exchange |
| PUT `/users/me/learning-goals` | `{ skillIds: [int] }` (replaces all, max 15) | `UserPublic`; a skill cannot be both known and a goal (400) |

## Projects
| Endpoint | Body / query | Response / rules |
|---|---|---|
| GET `/projects` | `query?` (title or description contains), `skillIds?` (comma list, project needs ANY), `categoryId?`, `difficulty?`, `status?` (OPEN default; OPEN/IN_PROGRESS/COMPLETED), `hasOpenSeats?` (true), `mine?` (`owned`: my projects of any status incl. DRAFT/ARCHIVED; `member`: projects I joined), `sort?` (`newest` default, `oldest`, `seats`), `page`, `limit` | paginated `ProjectListItem`. Without `mine`, DRAFT and ARCHIVED are never returned |
| POST `/projects` | `{ title 5..100, description 20..2000, categoryId, difficulty, maxTeamSize 2..10, hoursPerWeek? 1..60, deadline? (future date), githubUrl? , demoUrl? (https), skills: [{skillId, minLevel}] 1..10, status? DRAFT\|OPEN (default DRAFT) }` | 201 `ProjectDetail`; caller becomes owner |
| GET `/projects/:id` | | `ProjectDetail`; DRAFT visible only to owner (else 404) |
| PATCH `/projects/:id` | any subset of the create fields + `status` | owner only (403); `maxTeamSize` cannot go below seatsTaken (409); status must follow the transition table (409); `skills` replaces all; COMPLETED/ARCHIVED projects cannot be edited except `status → ARCHIVED` |

## Applications
| Endpoint | Body / query | Response / rules |
|---|---|---|
| POST `/projects/:id/applications` | `{ message 10..500 }` | 201 `Application`. 400 own project; 404 project hidden/unknown; 409 not OPEN, or already applied (a WITHDRAWN application is reopened as PENDING instead; REJECTED/ACCEPTED = 409). Creates notification APPLICATION_RECEIVED for the owner |
| GET `/projects/:id/applications` | `status?`, `page`, `limit` | owner only (403): paginated `Application` (applicant card included) |
| PATCH `/applications/:id` | `{ status: "ACCEPTED"\|"REJECTED"\|"WITHDRAWN" }` | owner may ACCEPT/REJECT; applicant may WITHDRAW; else 403. Illegal transition or full team = 409. Accept runs the locked transaction in doc 06 |
| GET `/users/me/applications` | `status?`, `page`, `limit` | paginated `Application` of the caller |

## Skill exchanges
| Endpoint | Body / query | Response / rules |
|---|---|---|
| POST `/exchanges` | `{ recipientId, offeredSkillId, requestedSkillId, message 10..500 }` | 201 `Exchange`; 400 self / skill not on the right profile; 404 recipient unknown; 409 active duplicate. Notification EXCHANGE_RECEIVED |
| GET `/exchanges` | `box?` (`incoming`\|`outgoing`\|`all` default), `status?`, `page`, `limit` | paginated `Exchange` (only ones the caller sent or received) |
| PATCH `/exchanges/:id` | `{ status }` | per state machine in doc 06; 404 if the caller is not a participant; 403 if participant but not allowed this action; 409 illegal transition. Creates the matching notification |

## Matching
| GET `/projects/:id/matches` | `limit` (default 20, max 50) | owner only (403): `MatchResult[]` sorted by score desc, then fullName |

## Notifications
| Endpoint | Response |
|---|---|
| GET `/notifications` (`unread?` true, `page`, `limit`) | paginated `Notification`, newest first |
| GET `/notifications/unread-count` | `{ count }` |
| PATCH `/notifications/read-all` | `{ updated: n }` (register BEFORE `/:id/read` in the router) |
| PATCH `/notifications/:id/read` | `Notification`; 404 if not the caller's |

## Analytics and health
GET `/analytics/skill-demand` returns rows of the view `skill_demand_supply` (`id, name, openProjectsNeedingIt, studentsWhoKnowIt, studentsWhoWantIt`) ordered by demand desc, top 20 (numbers converted from BigInt to Number).
GET `/health` (Public) returns `{ data: { status: "ok" } }` and checks the database.

## Notification message and link rendering (server side)
| type | recipient | message | link |
|---|---|---|---|
| APPLICATION_RECEIVED | owner | "{applicant} applied to {project}" | `/projects/{projectId}/applications` |
| APPLICATION_ACCEPTED | applicant | "You were accepted into {project}" | `/projects/{projectId}` |
| APPLICATION_REJECTED | applicant | "Your application to {project} was not accepted" | `/applications` |
| EXCHANGE_RECEIVED | recipient | "{sender} wants to swap {offered} for {requested}" | `/exchanges` |
| EXCHANGE_ACCEPTED / REJECTED | sender | "{recipient} accepted / declined your exchange" | `/exchanges` |
| EXCHANGE_COMPLETED | the other participant | "{user} marked your exchange completed" | `/exchanges` |
Notifications are created inside the same transaction as the change they describe, so a failed operation never leaves a misleading notification.

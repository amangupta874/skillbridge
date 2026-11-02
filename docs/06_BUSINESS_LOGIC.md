# 06. Business logic: rules, state machines, algorithms

All of this lives in `*.service.js` files. Services throw `AppError` helpers; they never use `req`/`res`.

## Auth (modules/auth)
```js
import bcrypt from 'bcryptjs';
// register: normalise email -> hash -> create user -> create session -> return { user, rawToken }
const email = input.email.trim().toLowerCase();
const passwordHash = await bcrypt.hash(input.password, 12);          // ~300 ms, on purpose
// catch Prisma P2002 on users.email -> throw new AppError(409, 'DUPLICATE', 'An account with this email already exists')
// login: find by email; ALWAYS run bcrypt.compare against a stored hash or a dummy hash so timing is similar;
//        wrong email or wrong password -> unauthorized('Invalid email or password'); delete this user's expired sessions; create session
// session: rawToken = generateToken(); store { id: hashToken(rawToken), userId, expiresAt: now + SESSION_DAYS }; cookie carries rawToken only
```
Cookie options (one helper `sessionCookieOptions()` used for set AND clear):
`{ httpOnly: true, secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none', sameSite: env.COOKIE_SAMESITE, path: '/', maxAge: env.SESSION_DAYS * 86400000 }`.
Password zod rule: `z.string().min(8).max(72).regex(/[A-Za-z]/, 'Must contain a letter').regex(/[0-9]/, 'Must contain a digit')`. Email: `z.email()`.
Logout deletes the session row (`deleteMany` so a missing row is not an error) and clears the cookie.

## State machines (anything not listed is 409 `CONFLICT`)
```js
// who may perform each transition. 'owner' = project owner, 'applicant', 'recipient'/'sender' of the exchange, 'participant' = sender or recipient
export const APPLICATION_TRANSITIONS = {
  PENDING:   { ACCEPTED: 'owner', REJECTED: 'owner', WITHDRAWN: 'applicant' },
  WITHDRAWN: { PENDING: 'applicant' },       // reopening happens through POST /projects/:id/applications, only while project is OPEN
  ACCEPTED:  {},
  REJECTED:  {},
};
export const EXCHANGE_TRANSITIONS = {
  PENDING:   { ACCEPTED: 'recipient', REJECTED: 'recipient', CANCELLED: 'sender' },
  ACCEPTED:  { COMPLETED: 'participant', CANCELLED: 'participant' },
  REJECTED: {}, CANCELLED: {}, COMPLETED: {},
};
export const PROJECT_TRANSITIONS = {          // owner only
  DRAFT: ['OPEN', 'ARCHIVED'], OPEN: ['IN_PROGRESS', 'ARCHIVED'], IN_PROGRESS: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'], ARCHIVED: [],
};
```
Put these in a `transitions.js` per module with a pure helper `getAllowedTransitions(table, currentStatus, role)` and unit-test every row.
Order of checks in a PATCH: 404 (not found / not visible) -> 403 (not the right actor) -> 409 (illegal transition). `allowedTransitions` in DTOs comes from the same helper.

## Applying (applications.service.js)
```js
export async function applyToProject({ projectId, applicantId, message }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || (project.status === 'DRAFT' && project.ownerId !== applicantId)) throw notFound('Project not found');
  if (project.ownerId === applicantId) throw badRequest('You cannot apply to your own project');
  if (project.status !== 'OPEN') throw conflict('This project is not accepting applications');

  const existing = await prisma.projectApplication.findUnique({
    where: { projectId_applicantId: { projectId, applicantId } },
  });
  if (existing && existing.status !== 'WITHDRAWN') throw conflict('You have already applied to this project');

  return prisma.$transaction(async (tx) => {
    const application = existing
      ? await tx.projectApplication.update({ where: { id: existing.id }, data: { status: 'PENDING', message, decidedAt: null, createdAt: new Date() } })
      : await tx.projectApplication.create({ data: { projectId, applicantId, message } });
    await tx.notification.create({ data: { recipientId: project.ownerId, type: 'APPLICATION_RECEIVED', applicationId: application.id } });
    return application;
  });
  // a race between two identical submits ends in P2002 -> the error handler returns 409. That is acceptable.
}
```
Withdraw: load application; 404 if missing or caller is not the applicant (use 404 to avoid leaking); require status PENDING (409 otherwise); set WITHDRAWN. No notification.

## Deciding (the concurrency-critical function; copy exactly, then write the Promise.all test)
```js
export async function decideApplication({ applicationId, ownerId, decision }) {      // decision: 'ACCEPTED' | 'REJECTED'
  return prisma.$transaction(async (tx) => {
    const application = await tx.projectApplication.findUnique({ where: { id: applicationId }, include: { project: true } });
    if (!application) throw notFound('Application not found');
    if (application.project.ownerId !== ownerId) throw forbidden('Only the project owner can decide on applications');

    // 1. Lock the project row. A second request for the same project waits here until this transaction commits.
    await tx.$queryRaw`SELECT id FROM projects WHERE id = ${application.projectId} FOR UPDATE`;

    // 2. Re-read inside the lock: another request may have changed the application while we waited.
    const current = await tx.projectApplication.findUnique({ where: { id: applicationId } });
    if (current.status !== 'PENDING') throw conflict('This application was already processed');

    if (decision === 'ACCEPTED') {
      const project = await tx.project.findUnique({
        where: { id: application.projectId },
        include: { _count: { select: { members: true } } },
      });
      if (project.status !== 'OPEN') throw conflict('This project is not open');
      const seatsTaken = 1 + project._count.members;                  // 1 = the owner
      if (seatsTaken >= project.maxTeamSize) throw conflict('The team is already full');
      await tx.projectMember.create({ data: { projectId: project.id, userId: application.applicantId } });
    }

    const updated = await tx.projectApplication.update({ where: { id: applicationId }, data: { status: decision, decidedAt: new Date() } });
    await tx.notification.create({
      data: { recipientId: application.applicantId, type: decision === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED', applicationId },
    });
    return updated;                                                    // everything commits together or not at all
  });
}
```
Why it is needed (proven on PostgreSQL 16): without the lock, two simultaneous accepts for the last seat BOTH succeed (3 members in a 3-seat project that already
had 1 member + owner); with the lock exactly one succeeds and the other gets 409 "team is full".
Required test: project `maxTeamSize: 3`, owner + 1 member already; two PENDING applications; `await Promise.all([accept(a), accept(b)])`;
expect exactly one 200 and one 409, `members.length === 2`, exactly one APPLICATION_ACCEPTED notification.
If a transaction is slow, pass `{ maxWait: 5000, timeout: 10000 }` as the second argument to `$transaction`.

## Projects (projects.service.js)
- Create: owner = caller; skills inserted in the same transaction; `status` DRAFT unless OPEN requested. Validate every `skillId` exists (400 listing unknown ids).
- Update: owner only; fields as in the API spec; `maxTeamSize >= seatsTaken` else 409; skills replaced inside a transaction; status via `PROJECT_TRANSITIONS`.
- Visibility: DRAFT only to the owner; list excludes DRAFT/ARCHIVED unless `mine=owned`.
- List filters build one `where` object (reuse it for `count`): `status` (default OPEN), `categoryId`, `difficulty`, text `OR` on title/description (insensitive),
  `skills: { some: { skillId: { in: skillIds } } }`, `hasOpenSeats` is applied after counting seats: fetch with `_count.members`, filter `maxTeamSize - 1 - members > 0`.
  To keep pagination correct with `hasOpenSeats`, use a raw-SQL-free approach: when `hasOpenSeats=true`, load ids+counts for the filtered set (cap 500), filter, then slice the page.
- Sorting: `newest` = `createdAt desc, id asc`; `oldest` = `createdAt asc`; `seats` = fewest seats left first (computed in memory for the capped set).

## Skill exchange (exchanges.service.js)
```js
export async function createExchange({ senderId, recipientId, offeredSkillId, requestedSkillId, message }) {
  if (senderId === recipientId) throw badRequest('You cannot exchange skills with yourself');
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) throw notFound('Student not found');
  const senderKnowsOffered = await prisma.userSkill.findUnique({ where: { userId_skillId: { userId: senderId, skillId: offeredSkillId } } });
  if (!senderKnowsOffered) throw badRequest('You can only offer a skill listed on your profile');
  const recipientKnowsRequested = await prisma.userSkill.findUnique({ where: { userId_skillId: { userId: recipientId, skillId: requestedSkillId } } });
  if (!recipientKnowsRequested) throw badRequest('That student has not listed the requested skill');
  // create exchange + EXCHANGE_RECEIVED notification in one transaction; P2002 on the partial unique index -> 409 'An active exchange for these skills already exists'
}
```
`changeExchangeStatus`: load exchange; if caller is neither sender nor recipient -> 404; compute the caller's role(s) (`sender`, `recipient`, `participant`);
look up `EXCHANGE_TRANSITIONS[current][next]`; undefined -> 409; role mismatch -> 403. Notifications: ACCEPTED/REJECTED -> sender, COMPLETED -> the other participant. CANCELLED creates none.
Removing a skill from a profile while it is the offered skill of a PENDING/ACCEPTED exchange the user sent -> 409 (check in `replaceSkills`).

## Matching (matching.service.js; scoring is already implemented in `scoreCandidate.js`)
`getMatchesForProject({ projectId, ownerId, limit })`:
1. Load project (+ `skills` with names/minLevel, `members`); 404 if missing; 403 if caller is not the owner.
2. `requiredSkillIds` = project skills. If none, return `[]`.
3. Team skill ids = skills of the owner and all members (`userSkill.findMany({ where: { userId: { in: teamUserIds } } })`).
4. Candidates = users NOT in (owner + members) who have a `userSkill` OR a `learningGoal` for any required skill (two queries, merge ids, cap 200). Load their skills and goals in bulk (no query per candidate).
5. `scoreCandidate` per candidate; drop score 0; sort by score desc then name; take `limit`; map to `MatchResult` (UserCard + score + breakdown + reasons).
Weights: 0.60 coverage, 0.20 proficiency, 0.10 gap fill, 0.10 learning. Worked example (tested): score 53. Never label the score a probability.

## Notifications
Created ONLY inside the transaction of the operation that causes them. Rendering (`message`, `link`) happens when listing, by joining application -> project/applicant or exchange -> sender/recipient/skills.
`unread-count` = `count({ where: { recipientId, isRead: false } })`. `read-all` = `updateMany`. Marking someone else's notification = 404.

## Profile
- `PATCH /users/me`: all optional fields; links and interests replace the existing sets inside one transaction; `collegeId` must exist.
- Skills/learning goals: validate ids exist (400 with unknown ids); a skill may not be in both sets (400).
- Public profile hides email; `topSkills` = highest levels first, then name.

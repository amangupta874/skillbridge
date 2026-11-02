# 01. Product requirements

## Problem and solution
Students cannot easily find teammates with complementary skills, projects that need their skills, or peers to trade knowledge with.
SkillBridge connects what students know, what they want to learn, and what projects need. It does NOT claim to be unique; its
differentiation is explainable matching and a structured skill-exchange flow. The match score is a ranking aid, never a probability of success.

## Users
One account type: student. "Project owner", "team member", "applicant", "exchange sender/recipient" are roles per project or per request.
Personas: project beginner (wants to join a project), project founder (wants a team), skill sharer (trades skills).

## MVP features
| ID | Feature | Priority |
|---|---|---|
| F-01 | Register, login, logout, current user, protected pages, session expiry | Must |
| F-02 | Profile: bio, college, weekly hours, links, skills with levels, learning goals, interests | Must |
| F-03 | Skill catalogue with categories and aliases (so "NodeJS" resolves to Node.js) | Must |
| F-04 | Projects: create, edit, publish, status lifecycle, required skills with minimum level, team size, links | Must |
| F-05 | Discovery: search, filters (skill, category, difficulty, status, open seats), sort, pagination | Must |
| F-06 | Applications: apply, withdraw, view own, owner reviews and accepts or rejects | Must |
| F-07 | Teams: membership created on acceptance; capacity never exceeded, even concurrently | Must |
| F-08 | Skill exchange: send, accept, reject, cancel, complete | Must |
| F-09 | Matching: ranked candidates for a project with score breakdown and plain-language reasons | Must |
| F-10 | In-app notifications: list, unread count, mark read | Should |
| F-11 | Dashboard: recommended projects, pending applications, incoming exchanges, recent notifications | Should |
| F-12 | Analytics: SQL view `skill_demand_supply` shown on a small "Skill trends" page (Data Engineering component) | Should |

## Functional requirements with acceptance criteria
| ID | Requirement | Acceptance |
|---|---|---|
| FR-01 | Visitor registers with name, email, password | Duplicate email gives 409; response never contains the hash; user is logged in after register |
| FR-02 | Student logs in and out | Wrong credentials give a generic 401; logout deletes the server-side session |
| FR-03 | Student edits profile and skills | Skills must exist in the catalogue; each has a level; visible on public profile (without email) |
| FR-04 | Owner creates and edits projects | Only the owner edits; team size 2..10; status changes follow the transition table |
| FR-05 | Student searches and filters projects | Empty result is 200 with empty list; page size capped at 50 server-side |
| FR-06 | Student applies to an open project | Cannot apply to own project, to a non-OPEN project, or twice |
| FR-07 | Owner accepts or rejects applications | Only the owner decides; an already-decided application gives 409 |
| FR-08 | Team never exceeds capacity | Two concurrent accepts for the last seat: exactly one succeeds |
| FR-09 | Applicant withdraws a pending application | Only the applicant, only while PENDING |
| FR-10 | Student requests a skill exchange | Not with self; offered skill on own profile; requested skill on recipient's profile; no duplicate active request |
| FR-11 | Recipient accepts or rejects; participants complete or cancel | Only allowed transitions by allowed actors; only participants can view |
| FR-12 | Owner sees ranked candidates | Owner and current members excluded; every result has score, breakdown, reasons |
| FR-13 | Student sees notifications | Created only after the business operation succeeded; read only your own |

## Business rules
BR-01 Email unique, stored lower case. BR-02 One level per user per skill; one link per type. BR-03 Owner holds one seat; seats taken = 1 + members.
BR-04 Team size (including owner) 2..10. BR-05 Applications only while project is OPEN. BR-06 No application to own project; one per user per project.
BR-07 Only the owner decides; only the applicant withdraws. BR-08 Accept = membership + status update + notification in ONE transaction, never over capacity.
BR-09 REJECTED is final; WITHDRAWN can be reopened by the applicant while the project is OPEN. BR-10 No exchange with yourself.
BR-11 Offered skill is on sender's profile; requested skill is on recipient's profile. BR-12 One active (PENDING/ACCEPTED) exchange per sender, recipient and skill pair.
BR-13 Matching excludes owner and members; a missing skill on a profile is not proof the person lacks it. BR-14 Team size, "full", unread count are derived on read.

## Non-functional requirements (targets, verify before claiming)
Security (hashed passwords, httpOnly cookie, server-side authorisation, validation, rate limiting). Integrity (FKs, CHECKs, transactions).
Performance (paginated lists, indexes; project list under 500 ms on the demo data). Reliability (central error handling, health endpoint).
Usability (loading, empty, error states; responsive from 360 px wide). Accessibility (semantic HTML, labels on inputs, keyboard focus, contrast).
Maintainability (module-per-feature, tests for business rules). Observability (JSON logs with request id; passwords and cookies redacted).

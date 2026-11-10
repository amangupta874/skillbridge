# PROGRESS: FRONTEND person (only the frontend person's agent edits this file)

Tick a task when its "done when" in docs/10_DAILY_PLAN.md is met and `npm run verify` is green. Dates and tasks: docs/11_TEAM_SCHEDULE.md.

- [x] Day 1 fork, clone, install, run verify
- [x] 2 client foundation: api client, AuthProvider, ProtectedRoute, layouts, shared components (plan D3 client)
- [x] 3 login and register pages + client tests (plan D4 client)   - [x] 4 dashboard shell, navbar, public profile page
- [ ] 5 SkillPicker + edit profile page (plan D5 client)          - [ ] 6 deploy frontend + /api rewrite (plan D6)
- [ ] 7 review (plan D7)                                           - [ ] 8 ProjectCard, filters, pagination with sample data
- [ ] 9 discovery page + project detail (plan D9)                  - [ ] 10 project form + my projects (plan D10)
- [ ] 11 applications UI (plan D13)                                - [ ] 12 exchanges UI + people (plan D16)
- [ ] 13 matching UI (plan D18)                                    - [ ] 14 notifications UI + redeploy frontend (plan D19 client)
- [ ] 15 dashboard + trends page (plan D20 client)                 - [ ] 16 frontend polish (plan D23)
- [ ] 17 accessibility + client tests (plan D24)                   - [ ] 18 live regression
- [ ] 19 frontend fixes          - [ ] 20 README + screenshots (plan D27)
- [ ] 21 FEATURE FREEZE          - [ ] 22-31 buffer, rehearsal, code defence, final checks

## Notes per task (files, tests added, manual checks, issues)
- Day 1: Created branch feature/frontend-day1. Installed workspace dependencies (`npm install`). Executed baseline lint (`oxlint` + `eslint`), unit/smoke tests (`vitest run` on client and server), and production build (`vite build`). All checks passed green (`npm run verify`).
- Day 2 (plan D3 client): Built client API wrapper (client.js, ApiError, fieldErrorsFromApiError, auth.js), AuthProvider with TanStack useQuery and cache clearing, ProtectedRoute with loading and redirect, responsive AppLayout with mobile navigation menu and AuthLayout, shared UI components (Button, Input, ErrorBanner, Spinner, EmptyState, ToastProvider), wired React Router with auth and protected placeholder routes. Added unit tests for api client, ProtectedRoute, components, and App root navigation. npm run verify is green.
- Day 3 (plan D4 client): Built full Login and Register pages using react-hook-form + zodResolver with API-aligned validation schemas. Implemented backend error handling via fieldErrorsFromApiError (field-level server errors) and ErrorBanner (general errors), pending states disabling submits with spinner, and redirecting authenticated users. Created personalized DashboardPage greeting showing the user's name. Added 8 unit tests in AuthPages.test.jsx covering form validation, 401 error display, duplicate email conflict handling, valid login redirect, and dashboard greeting. npm run verify is green.
- Day 4: Built Dashboard shell with recommended projects, pending applications, incoming skill exchanges, recent notifications, and quick action shortcuts using API-spec compliant sample data. Polished AppLayout top navbar with responsive mobile menu collapse and direct user public profile link/avatar indicator. Implemented PublicProfilePage (/users/:id) rendering student bio, college, weekly availability, member since, skills with level badges, learning goals, interests, external links, and conditional "Request skill exchange" action (hidden on own profile). Created shared Badge, Card, SkillBadge components, and users API helper. Added 9 unit tests across Badge and PublicProfilePage test suites (34 client tests passing). Linting and build pass with 0 errors.

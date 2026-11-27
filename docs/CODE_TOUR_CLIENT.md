# SkillBridge client code tour

## Where to start

`client/src/main.jsx` mounts React in Strict Mode and imports `index.css`, which loads Tailwind and sets visible keyboard focus outlines. `App.jsx` creates the TanStack Query client, wraps the app in the auth and toast providers, and declares the routes with React Router's `BrowserRouter`.

| Path in `client/src` | Responsibility |
| --- | --- |
| `api/` | Shared Axios client and feature methods for auth, users, projects, applications, exchanges, matching, notifications, skills and lookups. |
| `context/` | `AuthContext.jsx` exposes the current user, session state and auth actions through `useAuth`. |
| `layouts/` | `AuthLayout` is the shell for sign-in and registration. `AppLayout` provides responsive navigation, profile and logout controls, the notification bell and an outlet for the signed-in pages. |
| `pages/` | Route-level views that fetch data, handle mutations and compose UI components. |
| `components/` | Shared fields, cards, badges, dialogs, pagination and loading, empty and error states, plus feature components such as `SkillPicker` and `MatchCard`. |
| `schemas/` | Zod schemas for sign-in, registration, project forms and application messages. |
| `utils/` | Date and label formatting, the project status transition table and a hook for document titles. |
| `test/` and colocated `*.test.*` | Vitest setup, stack smoke tests, deployment config checks, and tests alongside pages, components and helpers. |

## Requests and server state

A page such as `ProjectsPage` calls `useQuery` with a key that includes its filters. Its query function calls `getProjects` in `api/projects.js`, which sends an Axios request with those filters as query parameters. The shared Axios instance uses `VITE_API_URL` when set and defaults to `/api`, with `withCredentials: true`. Feature helpers unwrap the API's `data` envelope. Paginated helpers return `{ items, meta }` so the UI can render rows and page controls from the same response.

TanStack Query caches reads by key and exposes loading, error and success states. Queries have automatic retries and window-focus refetch disabled by default. The notification bell opts into focus refetch and polls every 30 seconds. Pages commonly use `useMutation` for writes and invalidate affected keys afterward. For example, applying to a project refreshes its detail and application lists. Query failures usually appear in `ErrorBanner` with a Retry action. An empty response has its own empty state.

The Axios response interceptor turns failures into `ApiError` with `status`, `code`, `message` and `details` from the HTTP response and its error envelope. A missing HTTP response yields status `0`. When the envelope is missing, the client supplies a `NETWORK_ERROR` code, a connection message and empty details.

## Authentication and route protection

`AuthProvider` starts a `['me']` query against `GET /api/auth/me`. The auth helper converts a 401 to a signed-out result. Other failures surface as a session error with Retry. Sign-in and registration populate `['me']` from the returned user. Successful logout calls the API, clears the query cache and sets `['me']` to `null`. A 401 intercepted on a request other than login, register or `/auth/me` also sets `['me']` to `null`.

`ProtectedRoute` waits for the session check before mounting `AppLayout`. It shows a spinner during the check and a retryable error when the check fails without a user. An anonymous visitor is sent to `/login` with the attempted location in router state. The auth flow returns to its pathname after sign-in or registration when that state is present, otherwise to `/`. The sign-in and register routes use `AuthLayout`, which also sends signed-in users back into the app.

Project edit, application review and teammate matches each fetch project detail and check `myRole === 'OWNER'`. The application queue and matches queries are enabled only for the owner, and the edit form also blocks completed and archived projects. The corresponding server services check ownership using the authenticated caller. That protects the endpoint even when someone calls it directly or when the UI has stale data.

## Routed pages

| Route | Page and main components |
| --- | --- |
| `/login` | `LoginPage` takes email and password through shared `Input` and `Button` components, and displays general sign-in errors in `ErrorBanner`. |
| `/register` | `RegisterPage` collects name, email and password through the same shared controls and uses the returned account to sign the student in. |
| `/` | `DashboardPage` uses `DashboardSection` and `DashboardResults` to show recommendations, pending applications, incoming pending exchanges and owned projects. `RecommendedProjects` filters open-seat projects using the student's known skills, and `NotificationList` shows the five most recent notifications. |
| `/users/:id` | `PublicProfilePage` uses cards and skill badges to show the student's bio, college, availability, skills, goals, interests and links to signed-in visitors. The visitor can edit their own profile or open `RequestExchangeDialog` on another student's profile. |
| `/profile/edit` | `EditProfilePage` has five independently saved sections for basic information, links, interests, known skills and learning goals. Its two `SkillPicker` instances exclude skills chosen in the other section. |
| `/projects` | `ProjectsPage` combines `ProjectFilters`, `ProjectCard` and `Pagination` for project discovery. Search, skills, category, difficulty, open seats, sort and page are represented in the URL. |
| `/projects/new` | `ProjectFormPage` loads categories and uses `Input`, `Textarea`, `Select` and `SkillPicker` for the project details and required skills. The submit button determines whether the project is created as `DRAFT` or `OPEN`. |
| `/projects/:id/edit` | `ProjectFormPage` in edit mode preloads the owner's existing details and patches them on save. Success opens the project's detail page. |
| `/projects/:id` | `ProjectDetailPage` shows the description, required skills, seats, owner, members and optional details. It uses `Modal` for Apply and `ConfirmDialog` for withdrawal and project status changes. |
| `/projects/:id/applications` | `ProjectApplicationsPage` shows seat availability and a paginated, status-filtered queue of applicant cards with skill badges to the owner. Accept and Reject use `ConfirmDialog`. |
| `/projects/:id/matches` | `ProjectMatchesPage` uses `MatchCard` to show candidate profiles, top skills, an overall score, four labeled breakdown meters and server-provided reasons. |
| `/my-projects` | `MyProjectsPage` uses Owned and Joined tabs to request projects with `mine=owned` and `mine=member`, respectively, and displays them with `ProjectCard`. |
| `/applications` | `ApplicationsPage` lists the student's applications in cards, with status filters, pagination, project links and a withdrawal confirmation. |
| `/exchanges` | `ExchangesPage` filters paginated requests by direction and status. `ExchangeCard` shows the other student's profile link, the two skills, the message and the available actions. |
| `/people` | `PeoplePage` searches by student name and filters by skill. Paginated cards show the student's college, top skills and profile link. |
| `/notifications` | `NotificationsPage` offers an unread-only filter, pagination and Mark all as read. `NotificationList` shows the API's message and link with a relative timestamp and marks an unread item before navigating on a normal click. |
| `*` | `NotFoundPage` in `PlaceholderPage.jsx` renders the 404 heading and a home link. |

## Forms and server field errors

Sign-in, registration, project create/edit and the Apply dialog use React Hook Form with a Zod resolver. The project form connects `SkillPicker` through `Controller`, converts deadlines to ISO timestamps and maps chosen skills to `{ skillId, minLevel }` for the API. The profile editor uses controlled state and independent submit handlers for its five forms. The exchange dialog also uses controlled state and checks that the trimmed message is 10–500 characters.

`fieldErrorsFromApiError` strips the `body.`, `query.` or `params.` prefix and takes the first message from each array. For example, `body.email` maps to `email`. React Hook Form callers pass field errors to `setError`. The project form maps paths such as `skills.0.minLevel` to the required-skills picker. The profile editor and exchange dialog read mapped messages directly for their fields. Shared `Input`, `Select` and `Textarea` link errors to controls with `aria-describedby` and set `aria-invalid`. General failures use banners or toasts, with retry actions where the view provides them. Pending actions disable their submit controls.

## How action buttons are chosen

The application and exchange services return `allowedTransitions` for the caller's role and the record's current status. The project application queue shows Accept and Reject when the respective transitions are present, and My Applications checks for `WITHDRAWN` before offering Withdraw. `ExchangeCard` maps recognized transitions to Accept, Reject, Cancel or Mark completed. Accept submits directly, and the other three actions ask for confirmation.

Project detail uses `myRole` to show owner links and selects owner status buttons from `projectStatusTransitions` in `utils/projectStatus.js`. For other viewers it uses `myApplication.status`, the project's `OPEN` status and `isFull` to choose between applying, withdrawing, showing an application badge or explaining why applications are unavailable. The API checks the requested operation against the caller and the current record.

## Vercel rewrite and session cookie

`client/vercel.json` places the rewrite from `/api/:path*` to `https://skillbridge-6dhg.onrender.com/api/:path*` before the catch-all rewrite to `/index.html`, so requests use the Vercel origin in the browser and direct page links reach React Router. Vite provides the same relative `/api` path in development through its proxy to port 4000. Express sets the `sid` cookie on registration and login and clears it on logout. The cookie is HttpOnly, scoped to `/`, Secure in production, and defaults to SameSite=Lax and seven days. The browser holds and sends the cookie while React keeps the returned user in memory. Express checks a supplied Origin on state-changing requests against `CLIENT_ORIGIN`.

## Client tests

Run `npm test --workspace client`. Vitest runs with jsdom and React Testing Library. Most route and feature tests use real React components, an in-memory router or the app router, and a real QueryClient where needed. They mock feature API functions with resolved data or rejected errors. Examples include project and lookup responses, applicant and exchange transitions, notification reads and counts, and profile and skill searches. App-level navigation tests mock the auth API. Isolated guard and auth-form tests mock `useAuth`, and several profile and dashboard tests also supply a mocked signed-in user.

The tests cover route redirects and owner gating, validation and payloads, error mapping and retry, action visibility, URL filters, dashboard queries, notification reads, dialog keyboard behavior and the mobile menu. Helper tests construct `ApiError` values directly and use a fake clock for relative dates. The stack smoke tests exercise the actual form resolver, router and query libraries with local inputs. The deployment-config test reads the real `vercel.json` and checks its rewrites. This suite exercises browser-side behavior under controlled inputs. Verifying cookie transport through the live proxy requires a browser and the deployed services.

## Questions for the code defence

1. **Why use React Query?** It gives reads a shared cache, query keys and loading and error states. Mutations can invalidate related reads, so a project detail and its application list can refresh after a write.
2. **Why keep auth out of `localStorage`?** The session token is in the server's HttpOnly cookie, where client JavaScript cannot read it. React keeps the user object in memory and restores it through `/auth/me` after a reload.
3. **How do the proxy and cookie work together?** The browser calls `/api` on the Vercel origin, Vercel rewrites it to Render, and the browser stores and sends the API's `sid` cookie on the frontend origin. Vite proxies the same path locally.
4. **How was accessibility handled?** Fields have labels and linked errors, controls have visible focus, and the mobile menu exposes its expanded state. Dialogs have accessible names, trap Tab focus, support Escape when closable and return focus to the opener when possible.
5. **How are errors shown?** The Axios interceptor provides an `ApiError`. Forms put recognized validation errors beneath their fields, and pages and mutations show general failures through banners or toasts, often with Retry.
6. **Why is there no sample-data fallback?** The live UI uses API results. Showing an empty state for an empty result and an error for a failed request makes it clear whether the service returned results or the request needs a retry.
7. **How are routes protected?** The app waits for `/auth/me`, then `ProtectedRoute` renders the signed-in shell or redirects to `/login` with the attempted location in state. The auth flow uses its pathname when returning.
8. **How are owner-only pages protected, and why does the server still check?** Each owner page checks the project's `myRole`. Review and matching defer their data requests until it is `OWNER`. The server independently verifies the authenticated caller because someone can send requests outside the UI and client data can go stale.
9. **How do filters stay in the URL?** Project discovery reads and writes them using `useSearchParams` and builds the query key and request from the URL. A filter change resets the page to one, and copied URLs or reloads restore the selection. Other lists such as People keep their filters in component state.
10. **What do the tests prove?** Given mocked API or auth results, the client renders the expected controls and messages, submits the expected payloads and navigates as intended. The tests also check keyboard focus behavior and the shape of the rewrite config.
11. **What would you improve?** I would add a real-browser smoke test for signing in through the proxy, refreshing a protected page and signing out. That would exercise the cookie and routing together.
12. **How is the build deployed?** Vercel uses `client` as its root and runs `npm run build`, which calls `vite build`. It serves the static `dist` output with the API and SPA rewrites from `vercel.json`.

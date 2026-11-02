# 07. Frontend specification

Stack: React 18, React Router 6, TanStack Query 5, axios, react-hook-form + zod, Tailwind 4. JavaScript only. Plain Tailwind classes, no UI library.
Design: clean and calm. Primary indigo-600, neutral slate, success green, danger red, warning amber. Rounded-lg cards with a subtle border, max content width `max-w-6xl`,
system font stack. Mobile first: every page must work at 360 px wide; navbar collapses to a menu button below `md`.

## API client (`src/api/client.js`)
```js
import axios from 'axios';

export class ApiError extends Error {
  constructor({ status, code, message, details }) { super(message); this.status = status; this.code = code; this.details = details; }
}

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const body = error.response?.data?.error;
    return Promise.reject(new ApiError({
      status: error.response?.status ?? 0,
      code: body?.code ?? 'NETWORK_ERROR',
      message: body?.message ?? 'Cannot reach the server. Check your connection and try again.',
      details: body?.details ?? {},
    }));
  },
);

// Turns { "body.email": ["Invalid email"] } into { email: "Invalid email" } for react-hook-form setError.
export function fieldErrorsFromApiError(error) {
  const fieldErrors = {};
  for (const [key, messages] of Object.entries(error.details ?? {})) {
    fieldErrors[key.replace(/^(body|query|params)\./, '')] = messages[0];
  }
  return fieldErrors;
}
```
Feature API files (`src/api/projects.js` etc.) export small functions returning `response.data.data` (lists return `{ items: response.data.data, meta: response.data.meta }`).
Query keys: `['me']`, `['projects', filters]`, `['project', id]`, `['applications', 'mine', filters]`, `['applications', projectId, filters]`, `['exchanges', filters]`,
`['matches', projectId]`, `['notifications', filters]`, `['notifications', 'unread']`, `['skills', query]`, `['lookups']`, `['user', id]`, `['users', filters]`.
After every mutation call `queryClient.invalidateQueries` for the affected keys. Never keep server data in `useState`.

## Auth flow
`AuthProvider` runs `useQuery(['me'], getCurrentUser, { retry: false })`; 401 means "logged out", not an error banner. Exposes `{ user, isLoading, login, register, logout }`.
`ProtectedRoute` shows a spinner while loading, redirects to `/login` (remembering the target in router state) when logged out.
After login/register go to the remembered target or `/`. Logout clears the query cache (`queryClient.clear()`) then goes to `/login`.
A global response check: any 401 on a non-auth request clears `['me']` so the user lands on the login page with the message "Your session expired".

## Routes and pages
| Route | Page | Access | Contents |
|---|---|---|---|
| `/login`, `/register` | auth forms | public (redirect home if logged in) | inline field errors, submit disabled while pending, generic error banner |
| `/` | Dashboard | logged in | "Recommended projects" (open projects needing my skills), my pending applications, incoming exchange requests, 5 recent notifications, quick links |
| `/projects` | Discovery | logged in | search box, filters (skills multi-select, category, difficulty, open seats toggle, sort), grid of `ProjectCard`, pagination, "No projects match your filters" + Clear filters button |
| `/projects/new`, `/projects/:id/edit` | Project form | logged in; edit owner only | all fields, skill rows with minimum level, status choice (Draft/Open) |
| `/projects/:id` | Project detail | logged in | description, required skills, seats left bar, owner, members, links; buttons by `myRole`/`myApplication`: Apply (dialog with message), Withdraw, Edit, Change status, "View applications", "Find teammates" |
| `/projects/:id/applications` | Review queue | owner | list `Application` with applicant card (top skills), message, Accept/Reject buttons (only when allowed), status filter |
| `/projects/:id/matches` | Teammate matches | owner | `MatchCard`: name, college, score ring or bar, breakdown (4 small bars), reasons list, "View profile" |
| `/my-projects` | My projects | logged in | tabs Owned / Joined (uses `mine=owned|member`), status badges |
| `/applications` | My applications | logged in | list with status badge, project link, Withdraw when allowed |
| `/people` | Find people | logged in | search by name or skill, `UserCard` grid, "Request exchange" on a profile |
| `/users/:id` | Public profile | logged in | skills with level badges, goals, interests, links, "Request skill exchange" (not on own profile) |
| `/profile/edit` | Edit profile | logged in | basic info, links, interests, skills with level, learning goals; each section saves independently with success toast |
| `/exchanges` | Exchanges | logged in | tabs Incoming / Outgoing / All; action buttons come from `allowedTransitions` (Accept, Reject, Cancel, Mark completed) |
| `/notifications` | Notifications | logged in | list, unread highlighted, "Mark all read", click opens `link` and marks read |
| `/trends` | Skill trends | logged in | table/bars from `/analytics/skill-demand` (demand vs supply) |
| `*` | Not found | any | friendly 404 with link home |

## Shared components (`src/components`)
Button (variants primary/secondary/danger, `loading` prop disables and shows spinner), Input/Textarea/Select with label, hint and error text wired by `htmlFor`,
Card, Badge (status and level colours), Spinner, EmptyState (icon-free text + action), ErrorBanner (shows `ApiError.message`), Modal (focus trap, Esc closes), ConfirmDialog,
Pagination, Toast (small context provider, auto-dismiss, `role="status"`), SkillBadge, SkillPicker (autocomplete from `/skills`, add with level), ScoreBar.
Status colours: PENDING amber, ACCEPTED/OPEN green, REJECTED red, WITHDRAWN/CANCELLED slate, IN_PROGRESS blue, COMPLETED indigo, DRAFT slate, ARCHIVED slate.

## Rules for every page and form
1. Three states always: loading (spinner or skeleton), error (`ErrorBanner` + Retry), empty (message + next action). No blank screens.
2. Forms: react-hook-form + `zodResolver` with the same limits as the API; server errors mapped with `fieldErrorsFromApiError`; non-field errors in a banner.
3. Submit buttons disabled while pending; double-submit impossible. Destructive or irreversible actions (reject, withdraw, cancel, archive, logout-everywhere) use `ConfirmDialog`.
4. Show action buttons ONLY when allowed (use `allowedTransitions`, `myRole`, `isFull`); the server still enforces rules, and 403/409 messages are shown as toasts.
5. Accessibility: every input has a label, buttons have text or `aria-label`, focus is visible, modals trap focus, colour is never the only signal (badges have text), headings in order.
6. Responsive: grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; tables become stacked cards on small screens.
7. Dates shown with `toLocaleDateString`; relative time for notifications (`2 hours ago`) via a tiny helper, no date library.
8. No `dangerouslySetInnerHTML`. No secrets or API keys in the client. No `localStorage` for auth (cookie only).
9. Polling: unread count refetches every 30 s (`refetchInterval`) and on window focus.

## Client tests (Vitest + Testing Library; keep a few valuable ones)
Login form validation and server-error display; `ProtectedRoute` redirect; ProjectFilters updates the query; Apply dialog submit and error path; ExchangeCard shows only allowed actions.
Mock the API module (`vi.mock('../api/projects.js')`) rather than the network.

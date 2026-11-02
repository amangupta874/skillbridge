# Frontend rules (applies when editing files under client/)
- React 18 function components, JavaScript, React Router 6, TanStack Query 5, axios instance from `src/api/client.js`, react-hook-form + zodResolver, Tailwind 4 utility classes.
- No new UI libraries. No `localStorage` for auth. No `dangerouslySetInnerHTML`. No secrets in client code.
- Server data lives in TanStack Query, not `useState`. Invalidate the affected query keys after every mutation (key list in docs/07).
- Every page and list has loading, error (with Retry) and empty states. Submit buttons are disabled while pending. Destructive actions use ConfirmDialog.
- Show action buttons only when allowed (`allowedTransitions`, `myRole`, `isFull`); the server still enforces everything and its 403/409 messages are shown as toasts.
- Forms map server errors with `fieldErrorsFromApiError`. Every input has a label; focus is visible; modals trap focus; colour is never the only signal.
- Mobile first, 360 px minimum. Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Components are small, named in PascalCase, one per file. Tests with Testing Library mock the API modules, not the network.
- Tailwind 4: CSS entry is `@import "tailwindcss";` and there is no tailwind.config.js.

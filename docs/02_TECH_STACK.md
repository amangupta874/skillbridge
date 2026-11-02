# 02. Technology stack (pinned and verified together)

Versions below were installed and tested together (server tests, client tests, client build, lint). Keep the MAJOR versions.
`package.json` files in the repo are authoritative for exact versions.

## Server (`server/`, Node 22, ES modules)
| Package | Version used | Why / note |
|---|---|---|
| express | 5.x | Rejected promises in async handlers reach the error handler automatically. Wildcard routes need a name (`/*splat`). `req.query` is read-only |
| @prisma/client, prisma | **6.x (do NOT upgrade to 7)** | Prisma 7 requires a driver adapter, `prisma.config.ts` and a different generator; the schema here targets 6 |
| zod | 4.x | Use `z.url()`, `z.uuid()`, `z.email()` helpers; error details via `error.issues` (see `zodDetails`) |
| pino, pino-http | 10.x, 11.x | Structured logs, request id |
| helmet, cors, cookie-parser, express-rate-limit | 8.x, 2.x, 1.x, 8.x | Hardening, CORS with credentials, cookies, login rate limit |
| bcryptjs | 3.x | `import bcrypt from 'bcryptjs'`; cost factor 12 |
| dotenv | 18.x | loaded in `config/env.js` |
| vitest, supertest | 5.x, 7.x | tests |
| dotenv-cli | 8.x | `db:reset:test` script |

## Client (`client/`)
react 18.3, react-dom 18.3, react-router-dom 6.30 (use `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`), @tanstack/react-query 5,
axios 1, react-hook-form 7, **@hookform/resolvers 5** (v6 fails to install), zod 4, tailwindcss 4 + @tailwindcss/vite
(CSS entry is just `@import "tailwindcss";`, there is NO `tailwind.config.js`), vite 8 + @vitejs/plugin-react 6,
vitest 5 + jsdom + @testing-library/react 16 + user-event 14, oxlint (client lint: `oxlint src`).
Vite proxies `/api` to `http://localhost:4000`, so in development the browser sees one origin and cookies work.

## Commands to recreate the setup (only if something is missing; the repo already contains it)
```
npm install                                   # root, installs both workspaces
cd client && npm i react@18.3.1 react-dom@18.3.1        # install the pair in one command
npm i react-router-dom@6 @tanstack/react-query@5 axios react-hook-form@7 @hookform/resolvers@5 zod@4
npm i -D tailwindcss@4 @tailwindcss/vite@4 vitest jsdom @testing-library/react@16 @testing-library/jest-dom @testing-library/user-event
```

## Environment files
`server/.env` (copy from `server/.env.example`), `server/.env.test` (copy from `.env.test.example`), `client/.env` only if the API is on another origin.
Two local databases: `skillbridge_dev` and `skillbridge_test` (tests wipe the test database; never point `.env.test` at dev data).

## Databases for local work
PostgreSQL 16 locally, or Docker: `docker run --name sb-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
then create the two databases. Connection string format: `postgresql://USER:PASSWORD@localhost:5432/skillbridge_dev`.

## Dependency policy
No dependency outside this list without telling the human. Every library used must be listed in the README acknowledgements.

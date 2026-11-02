# 09. Deployment (target: live and tested by 21 Nov, final check 25 Nov)

Live cloud deployment is worth a dedicated mark; localhost does not count. Deploy a skeleton on Day 6 to find problems early, then redeploy after each week.

## Layout (recommended: ONE public origin, so cookies are trivial)
- Frontend: static hosting with HTTPS (Vercel, Netlify or Cloudflare Pages). Build: `npm run build --workspace client`, output `client/dist`.
- API: a Node web service (Render, Railway or Fly.io). Start command `npm start --workspace server`; build step `npm ci && npx prisma generate && npx prisma migrate deploy`.
- Database: managed PostgreSQL 16 (provider's free tier). Free tiers, limits and sleep behaviour change: CHECK the provider's current terms on the day you sign up.
- The frontend host PROXIES `/api/*` to the API host, so the browser only ever talks to the frontend's origin. Then `SameSite=Lax` cookies work and CORS is a non-issue.
  Vercel `client/vercel.json`:
  ```json
  { "rewrites": [
      { "source": "/api/:path*", "destination": "https://YOUR-API-HOST/api/:path*" },
      { "source": "/(.*)", "destination": "/index.html" } ] }
  ```
  Netlify `client/public/_redirects`: `/api/*  https://YOUR-API-HOST/api/:splat  200` then `/*  /index.html  200`.
- Fallback if proxying is impossible: separate origins; then set `COOKIE_SAMESITE=none` (forces `Secure`), `CLIENT_ORIGIN` to the exact frontend URL, `VITE_API_URL` to the API URL,
  and keep `originCheck`. Browsers may block third-party cookies in this mode, so prefer the proxy layout.

## Environment variables (API host)
`NODE_ENV=production`, `PORT` (host provides), `DATABASE_URL` (provider string, add `?sslmode=require` if the provider requires TLS), `CLIENT_ORIGIN` (public URL of the FRONTEND, no trailing slash),
`SESSION_DAYS=7`, `COOKIE_SAMESITE=lax`, `LOG_LEVEL=info`. The server refuses to start if one is missing or malformed.
Rate limiting behind two proxies: if the logs show every request from the same IP, set `app.set('trust proxy', 2)`; verify with one test request.

## Release checklist
1. `npm run verify` green on `main`; CI green.
2. Migrations applied (`prisma migrate deploy`) INCLUDING the raw SQL constraints; seed catalogue loaded (`npm run db:seed --workspace server` once, using the production `DATABASE_URL`).
3. `GET /api/health` returns 200 on the live URL; logs visible in the host dashboard.
4. On the live URL: register, login, create project, apply from a second account, accept, exchange, notification bell, logout. Cookie shows `HttpOnly; Secure`.
5. Demo data loaded with `prisma/seed-demo.js` (Day 26), demo passwords from env, not printed in docs.
6. README has the live URL, setup steps, test commands, screenshots, architecture and ER diagrams, API summary, acknowledgements and AI usage.
7. Warm the API (open the site 5 minutes before any demo; free services may sleep).
8. Backup: `pg_dump` of the production database saved locally on Day 31.

## Rollback
Keep the previous deployment available; if a migration breaks production, restore from the dump and redeploy the previous commit. Never edit applied migrations to "fix" production; add a new migration.

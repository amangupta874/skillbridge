# SkillBridge deployment runbook

This runbook deploys the API to Render, the database to Neon, and the frontend to Vercel. Keep database URLs in the provider dashboards and your own terminal; do not commit them.

## Neon: create the production database

1. Sign in to Neon and click **Create a project**.
2. Name it `skillbridge`, choose a region close to the Render service, and create the project.
3. Open the project dashboard and choose **Connect**.
4. Select the production branch and database, choose the Node.js connection string, and copy the pooled connection string. Keep it private. Add `?sslmode=require` if it is not already present.
5. Save this value for the Render `DATABASE_URL` setting. Do not use the local or test database URL.

## Render: create the API service

1. In Render, click **New** → **Web Service**, connect the SkillBridge GitHub repository, and select the deployment branch.
2. Set **Root Directory** to the repository root (leave it blank).
3. Set **Build Command** to:

   ```sh
   npm ci && cd server && npx prisma generate && npx prisma migrate deploy
   ```

4. Set **Start Command** to:

   ```sh
   cd server && npm start
   ```

5. Set **Health Check Path** to `/api/health`.
6. Under **Environment**, add these settings:

   | Key | Value |
   |---|---|
   | `NODE_VERSION` | `22` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | The Neon production connection string from above |
| `CLIENT_ORIGIN` | Temporarily `http://localhost:5173` if Vercel is not deployed yet; replace it with the exact public Vercel URL (no trailing slash) afterward |
   | `SESSION_DAYS` | `7` |
   | `COOKIE_SAMESITE` | `lax` |
   | `LOG_LEVEL` | `info` |

   Render supplies `PORT` to the service. Do not set it manually.
7. Create the service and wait for the first deploy. If Render reports a failed health check, open **Logs** and resolve that before deploying the frontend.
8. Copy the Render service hostname. The API base is `https://<render-service-host>`; health should load at `https://<render-service-host>/api/health` and return `{"data":{"status":"ok"}}`.

## Seed the production catalogue

Run this once from your own terminal after the first successful Render migration. It prompts privately for the Neon URL, runs the existing catalogue seed, and clears the shell variable afterward:

```sh
cd server
read -s "DATABASE_URL?Paste the Neon production connection string: "; echo
DATABASE_URL="$DATABASE_URL" npm run db:seed
unset DATABASE_URL
```

Do not run the seed against the local or test database by mistake. The seed only loads catalogue data; it does not create demo accounts.

## Vercel: deploy the frontend

1. Confirm the `/api` rewrite in `client/vercel.json` points to the Render service hostname. The current destination is `https://skillbridge-6dhg.onrender.com/api/:path*`.
2. In Vercel, click **Add New** → **Project**, import the SkillBridge repository, and set **Root Directory** to `client`.
3. Use the Vite defaults: build command `npm run build`, output directory `dist`.
4. Deploy, then copy the public Vercel URL.
5. Return to Render, set `CLIENT_ORIGIN` to that exact URL, and redeploy the API. The frontend proxy keeps browser requests on the Vercel origin.

## Check the live app

1. Open the Vercel site and register a new account.
2. In browser developer tools, confirm the `sid` cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`.
3. Log in, edit and save the profile, then log out.
4. Confirm the Render health check is green and `/api/health` returns status `ok`.

The browser flow requires HTTPS. A `Secure` cookie is expected to be ignored by browsers over plain HTTP, including localhost.

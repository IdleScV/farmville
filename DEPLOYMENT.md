# Deployment Guide

This is a monorepo. **One GitHub repository, two deployments.**

```
farmville/
├── packages/client  → Vercel  (static site, free)
└── packages/server  → Railway (Node.js + PostgreSQL, ~$5/mo)
```

The server is built using the `Dockerfile` at the repo root.
The database schema is applied automatically every time the server starts.

---

## Prerequisites

- GitHub repo pushed to `https://github.com/IdleScV/farmville`
- [Railway account](https://railway.app) connected to GitHub
- [Vercel account](https://vercel.com) connected to GitHub

---

## Part 1 — Railway (server + database)

> **Important:** Add the database first, then the server service.
> Railway does not automatically wire the two together — you must add the
> `DATABASE_URL` variable manually using Railway's reference syntax.

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Empty Project** (not "Deploy from GitHub" yet)

### 2. Add PostgreSQL

1. Inside the project → click **New** → **Database** → **PostgreSQL**
2. Wait ~30 seconds for it to provision
3. Click the PostgreSQL service → **Variables** tab
4. Note the service name shown at the top (usually `Postgres`) — you'll need it in step 4

### 3. Add the server service

1. Click **New** → **GitHub Repo** → select `IdleScV/farmville`
2. Railway detects the `Dockerfile` automatically and starts building
3. The first build will fail — that's expected because `DATABASE_URL` isn't set yet

### 4. Add environment variables to the server

1. Click the **server service** (the GitHub one) → **Variables** tab
2. Add the following variables one at a time:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `JWT_SECRET` | A long random secret (see note below) |
   | `CLIENT_URL` | Leave blank for now — fill in after Vercel is deployed |

   > **`DATABASE_URL` note:** `${{Postgres.DATABASE_URL}}` is Railway's variable reference syntax.
   > `Postgres` must match the exact name of your PostgreSQL service in Railway.
   > If your service is named differently (e.g. `PostgreSQL`), use `${{PostgreSQL.DATABASE_URL}}`.

   > **`JWT_SECRET` note:** Generate a secure value by running this in your terminal:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

3. After saving all variables, Railway automatically redeploys
4. The server retries the database connection up to 10 times — give it ~60 seconds to come up
5. Verify it's running: open the **Deploy Logs** tab and look for:
   ```
   [db] Migration complete
   Farmville server running on http://localhost:...
   ```

### 5. Generate a public URL

1. Click the server service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL (e.g. `https://farmville-server-production.up.railway.app`)
3. Verify by visiting `https://your-url.railway.app/health` — you should see:
   ```json
   { "status": "ok", "time": "..." }
   ```

---

## Part 2 — Vercel (client)

### 1. Import the project

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**
2. Select `IdleScV/farmville`
3. Leave **Root Directory** as `/` — `vercel.json` at the repo root configures everything

### 2. Add environment variable

Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway URL from Part 1 Step 5 (e.g. `https://farmville-server-production.up.railway.app`) |

### 3. Deploy

1. Click **Deploy**
2. After it completes, copy your Vercel URL (e.g. `https://farmville-abc123.vercel.app`)

### 4. Update Railway with the Vercel URL

1. Go back to Railway → server service → **Variables**
2. Set `CLIENT_URL` to your Vercel URL (e.g. `https://farmville-abc123.vercel.app`)
3. Railway redeploys automatically

### 5. Verify end to end

Open your Vercel URL in a browser. You should see the login screen.
Register an account — if the farm grid loads, everything is working.

---

## Environment variables reference

### Server (Railway)

| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | Yes | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | Yes | Random 32-byte hex string |
| `CLIENT_URL` | Yes | Your Vercel deployment URL |
| `PORT` | Auto-set | Do not override — Railway sets this |

### Client (Vercel)

| Variable | Required | Value |
|----------|----------|-------|
| `VITE_API_URL` | Yes | Your Railway deployment URL (no trailing slash) |

---

## Subsequent deploys

Every `git push` to `main` automatically redeploys both services. No manual steps needed.

---

## Troubleshooting

**Railway build fails immediately**
- Check the **Build Logs** tab in Railway
- Make sure the repo has a `Dockerfile` at the root (not inside a subdirectory)

**Server crashes on startup with a database error**
- Check that `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}` (not a literal string)
- Confirm the PostgreSQL service name in Railway matches the reference — e.g. if the service
  is named `PostgreSQL` use `${{PostgreSQL.DATABASE_URL}}`
- Check **Deploy Logs** for retry messages — it will try 10 times over ~30 seconds

**`/health` returns 502 or connection refused**
- The server may still be starting — wait 60 seconds and try again
- Check Deploy Logs for the line `Farmville server running on...`

**Client shows a blank screen or API errors**
- Open browser DevTools → Network tab — check if API requests are going to the right URL
- Confirm `VITE_API_URL` in Vercel does not have a trailing slash
- Confirm `CLIENT_URL` in Railway matches your exact Vercel domain

**CORS errors in the browser console**
- `CLIENT_URL` in Railway must exactly match the Vercel URL (including `https://`, no trailing slash)

---

## Running locally

**Terminal 1 — server** (requires PostgreSQL running locally):
```bash
cd packages/server
cp ../../.env.example .env   # first time only
npm run dev
```

**Terminal 2 — client:**
```bash
cd packages/client
cp ../../.env.example .env   # first time only
npm run dev
```

Open http://localhost:3000

**First-time local database setup:**
```bash
psql -U postgres -h 127.0.0.1 -c "CREATE USER farmville WITH PASSWORD 'farmville_dev';"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE farmville OWNER farmville;"
```

The schema is applied automatically when the server starts.
The default `.env.example` already points to the local database — no changes needed.

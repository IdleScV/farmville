# Deployment Guide

This is a monorepo. One GitHub repository powers both deployments.

```
farmville/
├── packages/client  → deployed to Vercel   (static site)
└── packages/server  → deployed to Railway  (Node.js + PostgreSQL)
```

---

## Railway — server + database

Railway builds the server using the `Dockerfile` at the repo root.
The server runs `migrate()` on startup, which applies `schema.sql` automatically.

### Step 1 — Add a PostgreSQL database

1. Open your Railway project → **New** → **Database** → **Add PostgreSQL**
2. Wait for it to provision (takes ~30 seconds)

### Step 2 — Add the server service

1. **New** → **GitHub Repo** → select `IdleScV/farmville`
2. Railway detects the `Dockerfile` and builds it automatically

### Step 3 — Link the database to the server

Railway does **not** inject `DATABASE_URL` automatically — you must reference it manually.

1. Click your **server service** → **Variables** tab → **New Variable**
2. Add each of these:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `JWT_SECRET` | A long random string — generate with `openssl rand -hex 32` |
   | `CLIENT_URL` | Your Vercel URL (fill in after Vercel deploy, e.g. `https://farmville.vercel.app`) |

   > `${{Postgres.DATABASE_URL}}` is Railway's syntax for referencing another service's variable.
   > Replace `Postgres` with whatever your PostgreSQL service is named in Railway if it differs.

3. Railway will redeploy after you save variables. The server will:
   - Retry the DB connection up to 10 times with backoff
   - Apply the schema automatically once connected
   - Start serving on `/health`

### Step 4 — Get your Railway URL

Go to your server service → **Settings** → **Networking** → **Generate Domain**.
Copy the URL (e.g. `https://farmville-server.railway.app`) — you'll need it for Vercel.

---

## Vercel — client

1. Go to [vercel.com](https://vercel.com) → **New Project** → import `IdleScV/farmville`
2. Leave root directory as `/` — `vercel.json` handles the rest
3. Under **Environment Variables** add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Railway server URL (e.g. `https://farmville-server.railway.app`) |

4. Click **Deploy**
5. Copy the Vercel URL and paste it into Railway's `CLIENT_URL` variable

---

## Environment variables reference

### Server (Railway)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Set to `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | Yes | Long random string, keep private |
| `CLIENT_URL` | Yes | Vercel URL, used for CORS |
| `PORT` | Auto | Set by Railway — do not override |

### Client (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | Yes | Full URL of the Railway server |

---

## Subsequent deploys

Every `git push` to `main` automatically triggers a redeploy on both services.

---

## Running locally

**Terminal 1 — server:**
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

**First-time local database setup:**
```bash
psql -U postgres -h 127.0.0.1 -c "CREATE USER farmville WITH PASSWORD 'farmville_dev';"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE farmville OWNER farmville;"
```
The schema is applied automatically when the server starts.

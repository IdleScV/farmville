# Deployment Guide

This is a monorepo. One GitHub repository powers both deployments.

```
farmville/
├── packages/client  → deployed to Vercel (static site)
└── packages/server  → deployed to Railway (Node.js + PostgreSQL)
```

You do not need two repos. Railway and Vercel each read from the same repo
using the config files at the root (`railway.json`, `vercel.json`).

---

## First-time setup

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

### 2. Railway — server + database

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository. Railway will detect `railway.json` automatically.
3. Inside the project, click **New** → **Database** → **PostgreSQL**
   - Railway injects `DATABASE_URL` into your server automatically. No manual config needed.
4. Go to your server service → **Variables** and add:

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | A long random string (e.g. run `openssl rand -hex 32`) |
   | `CLIENT_URL` | Your Vercel URL (fill in after step 3 below) |

5. Railway will build with `npm ci && npm run build` and start with `npm start`.
   The server runs `migrate()` on startup — the database schema is applied automatically.
6. Copy your Railway public URL (e.g. `https://farmville-server.railway.app`).

---

### 3. Vercel — client

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Leave the root directory as `/` — `vercel.json` handles the rest
3. Under **Environment Variables** add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Railway server URL from step 2 (e.g. `https://farmville-server.railway.app`) |

4. Click **Deploy**.
5. Copy the Vercel URL (e.g. `https://farmville.vercel.app`) and paste it into Railway's `CLIENT_URL` variable.

---

## Environment variables reference

### Server (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Auto-set by Railway | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign auth tokens — keep this private |
| `CLIENT_URL` | Yes | Vercel URL, used for CORS |
| `PORT` | Auto-set by Railway | HTTP port — do not override |

### Client (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Full URL of the Railway server |

---

## Subsequent deploys

Every `git push` to `main` automatically triggers a redeploy on both Railway and Vercel.
No manual steps needed after the initial setup.

---

## Running locally

You need two terminals.

**Terminal 1 — server** (requires PostgreSQL running locally):
```bash
cd packages/server
cp ../../.env.example .env   # first time only
npm run dev
```

**Terminal 2 — client:**
```bash
cd packages/client
cp ../../.env.example .env   # first time only, sets VITE_API_URL=http://localhost:3001
npm run dev
```

Local PostgreSQL connection string (default in `.env.example`):
```
DATABASE_URL=postgresql://farmville:farmville_dev@localhost:5432/farmville
```

To create the local database for the first time:
```bash
psql -U postgres -h 127.0.0.1 -c "CREATE USER farmville WITH PASSWORD 'farmville_dev';"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE farmville OWNER farmville;"
```
The schema is applied automatically when the server starts.

# Deploying to Vercel + Neon (free)

The whole app is a single Next.js project talking to one Postgres database,
so deployment is just "push the frontend, point it at a managed Postgres."
Total cost: **$0/month** on both services' free tiers.

## 1. Create a Neon Postgres database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string it gives you (the "pooled connection" one is
   fine — Prisma works through it). It looks like:
   `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require`
3. `pg_trgm` (used for search and related-word suggestions) is available on
   Neon by default — no extra setup needed, the app's own migration enables
   it.

## 2. Create a Google OAuth client for the production domain

In the same [Google Cloud OAuth client](https://console.cloud.google.com/apis/credentials)
used for local dev (or a new one), add:

- Authorized JavaScript origin: `https://<your-vercel-domain>`
- Authorized redirect URI: `https://<your-vercel-domain>/api/auth/callback/google`

(`<your-vercel-domain>` is either the `*.vercel.app` domain Vercel assigns,
or a custom domain you attach afterward — either way, come back and add it
here once you know it.)

## 3. Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Set the **Root Directory** to `frontend`.
3. Add these Environment Variables:
   - `DATABASE_URL` — the Neon connection string from step 1
   - `AUTH_SECRET` — a random string, e.g. `openssl rand -base64 33`
   - `AUTH_GOOGLE_ID` — the Google OAuth client ID
   - `AUTH_GOOGLE_SECRET` — the Google OAuth client secret
4. Deploy. The build runs `prisma migrate deploy` before `next build` (see
   `frontend/package.json`), so the database schema is created/updated on
   every deploy automatically — no separate migration step needed.

That's it — no servers, containers, or reverse proxy to manage. Vercel
terminates HTTPS and handles scaling/cold starts on its free tier.

## Updating

Just push to the branch Vercel is tracking — it redeploys (and re-runs
migrations) automatically.

## Notes

- The app talks to Postgres directly from Next.js server code (Server
  Actions / Server Components), so there's nothing else to expose publicly.
- If you outgrow Neon's free tier (usage-based compute/storage limits) or
  Vercel's, both have inexpensive paid tiers that scale up without changing
  anything in this repo.

# Deploy to Vercel

This branch (`deploy/vercel`) is configured for Vercel deployment. Render can stay running until you switch over, then suspend the Render service.

## What changed on this branch

- `server/index.ts` — skips `app.listen()` on Vercel; exports a serverless handler
- `server/storage.ts` — uses PostgreSQL session store (`connect-pg-simple`) in production so login works across serverless invocations
- `server/auth.ts` — production cookie settings for HTTPS
- `server/static.ts` — resolves static files from multiple paths in serverless
- `vercel.json` — static assets + API/SPA routing, includes `dist/**` in the function bundle
- `api/index.js` — Vercel serverless entry point

## Step 1: Push this branch

```bash
git push -u origin deploy/vercel
```

## Step 2: Connect Vercel to this branch

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your project (`myshop2`) or click **Add New → Project**
3. Import the GitHub repo: `Secure-Login`
4. Set **Production Branch** to `deploy/vercel`
5. Framework Preset: **Other**
6. Build Command: `npm run build` (or leave default — `vercel.json` sets it)
7. Output Directory: leave empty (handled by `vercel.json`)
8. Click **Deploy**

## Step 3: Set environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Key | Value | Environments |
|-----|-------|--------------|
| `NODE_ENV` | `production` | Production, Preview |
| `DATABASE_URL` | Your Supabase/Neon PostgreSQL connection string | Production, Preview |
| `SESSION_SECRET` | A long random secret string | Production, Preview |

Optional (only if you need to run DB init on deploy):

| Key | Value |
|-----|-------|
| `RUN_DB_INIT` | `true` |

**Important:** Use the Supabase **transaction pooler** URL (port `6543`) for serverless:

```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

## Step 4: Verify deployment

After deploy completes:

1. Visit your Vercel URL (e.g. `https://myshop2-zeta.vercel.app`)
2. Log in with your credentials
3. Add a product and confirm it persists after refresh
4. Create an invoice and print it
5. Check **Functions** tab in Vercel for any errors

## Step 5: Stop Render (when ready)

Once Vercel is working:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Open service `myshop-secure-login`
3. Click **Settings → Suspend Service** (or delete if no longer needed)

Keep Render running until you have confirmed Vercel works end-to-end.

## Troubleshooting

### "Cannot GET /" or blank page
- Check Vercel function logs under Deployments → Functions
- Confirm `DATABASE_URL` is set in Production environment
- Redeploy after adding env vars

### Login works once then fails
- Ensure `SESSION_SECRET` is set
- Confirm `DATABASE_URL` uses the pooler URL (port 6543)
- Sessions are stored in PostgreSQL table `user_sessions` (auto-created)

### Database connection errors
- Verify connection string is correct
- Run `npm run db:init` locally with the same `DATABASE_URL` if tables are missing
- Check Supabase allows connections from Vercel (pooler is recommended)

### Build fails
- Run `npm run build` locally first to catch errors
- Ensure Node.js 20.x is selected in Vercel project settings

## Local production test

```bash
npm run build
npm start
```

Visit `http://localhost:5000`

## Branch workflow

| Branch | Platform |
|--------|----------|
| `main` | Render (current production) |
| `deploy/vercel` | Vercel (new production) |

After Vercel is stable, you can merge `deploy/vercel` into `main` and point Vercel at `main`.

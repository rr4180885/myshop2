# Deploy Saha Electricals to Vercel

This branch (`deploy/rahul/vercel`) is the **Saha Electricals** shop deployment.

| Shop | Branch | Vercel project | Database |
|------|--------|----------------|----------|
| Brothers Enterprises | `deploy/vercel` | Existing (`myshop2`) | Brothers Neon/Supabase |
| Saha Electricals | `deploy/rahul/vercel` | **New project** | **New** Neon/Supabase |

Core app features (inventory, billing, invoices, settings) are the same. Differences:

- Default shop name: **Saha Electricals** (`shared/shop-config.ts`)
- Email flows **disabled** (forgot password, welcome email, invoice email)
- Separate `DATABASE_URL` and Vercel project

## Step 1: Create a fresh database

1. Create a **new** Neon or Supabase PostgreSQL project (do **not** reuse Brothers’ URL).
2. Copy the **transaction pooler** connection string (port `6543` for Supabase).

Locally (optional), init schema against the new DB:

```bash
# PowerShell
$env:DATABASE_URL="postgresql://..."
npm run db:init
```

Or set `RUN_DB_INIT=true` once in Vercel after first deploy.

## Step 2: Push this branch

```bash
git push -u origin deploy/rahul/vercel
```

## Step 3: Create a new Vercel project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**
2. Import the same GitHub repo
3. Set **Production Branch** to `deploy/rahul/vercel` (not `deploy/vercel`)
4. Framework Preset: **Other**
5. Build Command / Output: leave as `vercel.json` defaults
6. Deploy

## Step 4: Environment variables (Saha project only)

| Key | Value | Notes |
|-----|-------|--------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | Saha’s PostgreSQL URL | **Different** from Brothers |
| `SESSION_SECRET` | Long random string | Prefer a **new** secret |
| `SHOP_NAME` | `Saha Electricals` | Optional (already the branch default) |
| `ENABLE_EMAIL` | `false` | Optional (already the branch default) |
| `RUN_DB_INIT` | `true` | Optional, first deploy only |

Do **not** set Mailgun vars unless you later re-enable email (`ENABLE_EMAIL=true`).

## Step 5: Verify

1. Open the new Vercel URL
2. Confirm title / login brand shows **Saha Electricals**
3. Confirm **Forgot password** is hidden
4. Confirm billing has no customer email field
5. Create a product + invoice; data must live only in Saha’s DB

## Abstraction

All shop-specific defaults live in `shared/shop-config.ts`:

- `DEFAULT_SHOP_NAME` / phone / GSTIN
- `ENABLE_EMAIL`
- `DEFAULT_SETTINGS`

Brothers stays on `deploy/vercel` with its own branding and email enabled. Keep the two production branches independent so each shop can ship without affecting the other.

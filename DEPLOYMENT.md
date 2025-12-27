# Vercel Deployment Guide

## Project Status
Your Secure-Login project has been deployed to Vercel at:
- **Production URL**: https://myshop2-zeta.vercel.app
- **Inspect URL**: https://vercel.com/rr4180885s-projects/myshop2

## Changes Made

### 1. Fixed Build Script (`script/build.ts`)
- Added path aliases to ensure proper module resolution during build
- Paths configured: `@`, `@shared`, `@assets`

### 2. Updated Server Static File Serving (`server/static.ts`)
- Added proper express.static middleware for serving assets
- Implemented SPA fallback routing to serve index.html for all routes

### 3. Fixed Server Export (`server/index.ts`)
- Changed from synchronous export to async handler
- Ensures all routes and middleware are initialized before handling requests
- Critical for Vercel serverless functions

### 4. Updated Vercel Configuration (`vercel.json`)
- Added specific routes for static assets (`/assets/*`)
- Added route for favicon
- Configured API routes to go to the Lambda function
- Fallback route for SPA routing

## Required: Vercel Dashboard Configuration

The deployment may need additional configuration in the Vercel dashboard. Please follow these steps:

### Step 1: Check Environment Variables
1. Go to https://vercel.com/rr4180885s-projects/myshop2/settings/environment-variables
2. Ensure `DATABASE_URL` is set for Production environment:
   ```
   DATABASE_URL=postgresql://postgres.jrgjvlbztglybkslcthl:Rakesh@7257Ranjan@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
   ```
3. Ensure `NODE_ENV=production` is set

### Step 2: Check Function Configuration
1. Go to https://vercel.com/rr4180885s-projects/myshop2/settings/functions
2. Verify the following settings:
   - **Function Region**: Choose closest to your database (Mumbai/ap-south-1)
   - **Node.js Version**: 20.x or higher
   - **Memory**: At least 1024 MB (for large dependencies)
   - **Max Duration**: 10 seconds or more

### Step 3: Check Build Settings
1. Go to https://vercel.com/rr4180885s-projects/myshop2/settings
2. Under "Build & Development Settings":
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (handled by vercel.json)
   - **Install Command**: `npm install`

### Step 4: View Function Logs
To troubleshoot the "Cannot GET /" error:
1. Go to https://vercel.com/rr4180885s-projects/myshop2
2. Click on the latest deployment
3. Click on "Functions" tab
4. Look for error logs in the `dist/index.cjs` function
5. Check for:
   - Database connection errors
   - Missing environment variables
   - Module resolution errors

## Alternative: Simpler Vercel Configuration

If the current setup continues to have issues, you can try a simpler approach:

### Option A: Remove the `builds` Configuration
Delete or comment out the `builds` section in `vercel.json` and let Vercel auto-detect:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/"
    }
  ]
}
```

Then add a `vercel-build` script to `package.json`:
```json
"scripts": {
  "vercel-build": "npm run build"
}
```

### Option B: Use API Routes Structure
Create a new file `api/index.js`:
```javascript
const handler = require('../dist/index.cjs');
module.exports = handler;
```

## Testing Locally

To test the production build locally:
```bash
npm run build
npm start
```

Then visit http://localhost:3000

## Database Setup

Make sure your Supabase database has the required tables. Run migrations:
```bash
npm run db:push
```

## Troubleshooting

### Issue: "Cannot GET /"
**Possible causes**:
1. Lambda function not initializing properly
2. Static files not being served
3. Environment variables not set

**Solutions**:
1. Check Vercel function logs for errors
2. Verify DATABASE_URL is set in production
3. Ensure all environment variables are configured
4. Try redeploying: `vercel --prod`

### Issue: 404 on Static Assets
**Solution**: 
- Check that `dist/public` contains the built files
- Verify vercel.json routes are correct
- Check browser console for exact URLs that are 404ing

### Issue: Database Connection Errors
**Solution**:
- Verify DATABASE_URL environment variable
- Check Supabase connection pooler is accessible
- Ensure database tables exist (run `npm run db:push` locally first)

## Next Steps

1. Check the Vercel dashboard settings as outlined above
2. Review function logs for any errors
3. If needed, try the alternative configuration options
4. Test the API endpoints directly (e.g., /api/user)
5. Contact support if issues persist

## Support

For further assistance:
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Project GitHub: https://github.com/rr4180885/myshop2

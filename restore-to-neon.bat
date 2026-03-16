@echo off
echo ==================================
echo Restoring data to Neon database...
echo ==================================
set DATABASE_URL=postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
echo.
echo Step 1: Initializing database schema...
npm run db:init
echo.
echo Step 2: Restoring data...
npm run db:restore
echo.
echo Migration complete!
pause

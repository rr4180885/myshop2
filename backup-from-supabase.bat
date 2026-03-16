@echo off
echo ==================================
echo Backing up data from Supabase...
echo ==================================
set DATABASE_URL=postgresql://postgres.jrgjvlbztglybkslcthl:Rakesh@7257Ranjan@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
npm run db:backup
echo.
echo Backup complete! Check the ./backup folder
pause

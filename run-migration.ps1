# Migration Script - Supabase to Neon
Write-Host "=================================="
Write-Host "Database Migration: Supabase -> Neon"
Write-Host "=================================="

# Step 1: Backup from Supabase
Write-Host ""
Write-Host "Step 1: Backing up from Supabase..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres.jrgjvlbztglybkslcthl:Rakesh@7257Ranjan@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
npm run db:backup

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backup failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backup completed!" -ForegroundColor Green

# Step 2: Initialize Neon Database
Write-Host ""
Write-Host "Step 2: Creating tables in Neon..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
npm run db:init

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Table creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Tables created!" -ForegroundColor Green

# Step 3: Restore data to Neon
Write-Host ""
Write-Host "Step 3: Restoring data to Neon..." -ForegroundColor Yellow
npm run db:restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Data restore failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=================================="
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "=================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test your application with npm run dev"
Write-Host "2. Your Render deployment should now be using Neon"
Write-Host "3. Check backup files in backup folder"

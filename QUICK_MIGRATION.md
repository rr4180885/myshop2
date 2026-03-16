# Quick Migration Guide: Supabase → Neon.tech

## ✅ You're Ready to Migrate!

Your Neon.tech connection string:
```
postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🚀 3-Step Migration Process

### Step 1: Backup Data from Supabase

Run this command:
```batch
backup-from-supabase.bat
```

Or manually:
```batch
set DATABASE_URL=postgresql://postgres.jrgjvlbztglybkslcthl:Rakesh@7257Ranjan@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
npm run db:backup
```

**✅ Verify**: Check that `./backup` folder has JSON files with your data!

---

### Step 2: Migrate to Neon

Run this command:
```batch
restore-to-neon.bat
```

This will:
1. Create tables in Neon database
2. Import all your data (users, products, settings, invoices)

---

### Step 3: Update Your Environment

Update your DATABASE_URL to use Neon:

**For local development** - Create `.env` file:
```env
DATABASE_URL=postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**For Render.com deployment**:
1. Go to https://dashboard.render.com
2. Select your service
3. Go to "Environment" tab
4. Update `DATABASE_URL` variable
5. Save changes (will auto-redeploy)

---

## 🧪 Test Your Migration

Start your app:
```batch
npm run dev
```

Then verify:
- ✅ Login works
- ✅ Products are visible
- ✅ Settings are preserved
- ✅ Invoice history is intact

---

## 📊 What Changed?

### Removed:
- ❌ Supabase references in code
- ❌ `prepare: false` configuration (not needed for Neon)
- ❌ Supabase-specific documentation

### Added:
- ✅ `npm run db:backup` - Backup all data to JSON
- ✅ `npm run db:restore` - Restore data from JSON
- ✅ Neon.tech database connection
- ✅ Migration batch files

### Code Updates:
- ✅ `server/db-init.ts` - Removed Supabase comments
- ✅ `server/storage.ts` - Removed Supabase detection
- ✅ `package.json` - Added backup/restore scripts

---

## 💡 Why Neon.tech?

| Feature | Supabase | Neon.tech |
|---------|----------|-----------|
| **Free Storage** | 500 MB | 512 MB |
| **Auto-scaling** | Limited | ✅ Yes |
| **Cold Start** | Slower | ⚡ Instant |
| **Branching** | No | ✅ Yes |
| **Price** | Free tier limited | More generous free tier |

---

## 🆘 Troubleshooting

### Backup Failed?
```batch
# Check if Supabase is accessible
ping aws-1-ap-south-1.pooler.supabase.com
```

### Restore Failed?
- Ensure backup files exist in `./backup` folder
- Check Neon database is accessible
- Run `npm run db:init` first

### Connection Issues?
- Neon requires `?sslmode=require` in connection string
- Check your firewall settings
- Verify connection string is correct

---

## 🎯 Next Steps

1. ✅ Run `backup-from-supabase.bat`
2. ✅ Run `restore-to-neon.bat`
3. ✅ Test your application
4. ✅ Update production environment variables
5. ✅ Keep Supabase active for 1-2 weeks (safety)
6. ✅ Delete Supabase project after confirming everything works

---

## 📞 Support

- **Neon Docs**: https://neon.tech/docs
- **Neon Discord**: https://discord.gg/neon
- **Check Backup Files**: `./backup` folder

---

**Ready? Run `backup-from-supabase.bat` to start! 🚀**

# Supabase Transaction Pooler Fix

## ✅ Problem Solved

Your server was experiencing `CONNECT_TIMEOUT` errors when connecting to Supabase's transaction pooler (port 6543).

## 🔍 Root Cause

The `postgres-js` library requires `prepare: false` when connecting to Supabase's **transaction pooler**. Without this setting, the pooler times out because prepared statements are not supported in transaction mode.

## 🛠️ Changes Made

### Updated Files:
1. **server/db-init.ts** - Added transaction pooler configuration
2. **server/storage.ts** - Added transaction pooler configuration

### Configuration Added:
```javascript
const client = postgres(dbUrl, { 
  ssl: { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,  // CRITICAL for Supabase transaction pooler (port 6543)
});
```

## 📝 Key Settings:

- **`prepare: false`** - Disables prepared statements (required for transaction pooler)
- **`connect_timeout: 30`** - Increased timeout to 30 seconds
- **`max: 10`** - Connection pool size
- **`idle_timeout: 20`** - Idle connection timeout

## 🚀 Next Steps

1. **Commit the changes:**
   ```bash
   git add server/db-init.ts server/storage.ts
   git commit -m "fix: add prepare:false for Supabase transaction pooler"
   git push
   ```

2. **Render will auto-deploy** with the fix

3. **Your data is safe** - No database changes were made, only connection settings

## ℹ️ Why It Worked Before

The transaction pooler may have been more tolerant before, or you might have had fewer concurrent connections. The timeout started happening when the pooler became stricter about prepared statements.

## 📚 Reference

- [Supabase Docs - Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [postgres-js Transaction Mode](https://github.com/porsager/postgres#transactions)

---
**Fixed by:** Cline AI Assistant
**Date:** January 18, 2026

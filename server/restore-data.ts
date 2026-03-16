/**
 * Data Restore Script
 * Imports data from backup JSON files to new database
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, products, settings, invoices } from "../shared/schema";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function restoreData() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🔌 Connecting to new database...");
  
  try {
    const client = postgres(dbUrl, { 
      ssl: { rejectUnauthorized: false }, 
      max: 1,
    });
    const db = drizzle(client);

    console.log("✓ Connected to database");
    
    // Find the most recent full backup
    const backupDir = join(process.cwd(), "backup");
    const files = readdirSync(backupDir);
    const fullBackups = files.filter(f => f.startsWith("full-backup-") && f.endsWith(".json"));
    
    if (fullBackups.length === 0) {
      console.error("❌ No backup files found in ./backup directory");
      console.log("Please run: npm run db:backup first");
      process.exit(1);
    }
    
    // Sort to get the most recent
    fullBackups.sort().reverse();
    const latestBackup = fullBackups[0];
    
    console.log(`📦 Loading backup: ${latestBackup}`);
    const backupData = JSON.parse(
      readFileSync(join(backupDir, latestBackup), "utf-8")
    );
    
    console.log(`📊 Backup from: ${backupData.timestamp}`);
    
    // Restore users
    if (backupData.users && backupData.users.length > 0) {
      console.log(`📥 Restoring ${backupData.users.length} users...`);
      for (const user of backupData.users) {
        try {
          await db.insert(users).values(user).onConflictDoNothing();
        } catch (error) {
          console.warn(`⚠️  Skipped user ${user.username}:`, error);
        }
      }
      console.log("✓ Users restored");
    }
    
    // Restore products
    if (backupData.products && backupData.products.length > 0) {
      console.log(`📥 Restoring ${backupData.products.length} products...`);
      for (const product of backupData.products) {
        try {
          await db.insert(products).values(product).onConflictDoNothing();
        } catch (error) {
          console.warn(`⚠️  Skipped product ${product.code}:`, error);
        }
      }
      console.log("✓ Products restored");
    }
    
    // Restore settings
    if (backupData.settings && backupData.settings.length > 0) {
      console.log(`📥 Restoring ${backupData.settings.length} settings...`);
      for (const setting of backupData.settings) {
        try {
          await db.insert(settings).values(setting).onConflictDoNothing();
        } catch (error) {
          console.warn(`⚠️  Skipped setting:`, error);
        }
      }
      console.log("✓ Settings restored");
    }
    
    // Restore invoices
    if (backupData.invoices && backupData.invoices.length > 0) {
      console.log(`📥 Restoring ${backupData.invoices.length} invoices...`);
      for (const invoice of backupData.invoices) {
        try {
          await db.insert(invoices).values(invoice).onConflictDoNothing();
        } catch (error) {
          console.warn(`⚠️  Skipped invoice ${invoice.invoiceNumber}:`, error);
        }
      }
      console.log("✓ Invoices restored");
    }
    
    console.log("\n✅ Data restore completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${backupData.users?.length || 0}`);
    console.log(`   - Products: ${backupData.products?.length || 0}`);
    console.log(`   - Settings: ${backupData.settings?.length || 0}`);
    console.log(`   - Invoices: ${backupData.invoices?.length || 0}`);
    
    await client.end();
    
  } catch (error) {
    console.error("❌ Restore failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreData();
}

export { restoreData };

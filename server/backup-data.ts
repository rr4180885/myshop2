/**
 * Data Backup Script
 * Exports all data from current database to JSON files
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, products, settings, invoices } from "../shared/schema";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function backupData() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");
  
  try {
    const client = postgres(dbUrl, { 
      ssl: { rejectUnauthorized: false }, 
      max: 1,
      prepare: false,
    });
    const db = drizzle(client);

    console.log("✓ Connected to database");
    
    // Create backup directory
    const backupDir = join(process.cwd(), "backup");
    mkdirSync(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // Backup users
    console.log("📦 Backing up users...");
    const usersData = await db.select().from(users);
    writeFileSync(
      join(backupDir, `users-${timestamp}.json`),
      JSON.stringify(usersData, null, 2)
    );
    console.log(`✓ Backed up ${usersData.length} users`);
    
    // Backup products
    console.log("📦 Backing up products...");
    const productsData = await db.select().from(products);
    writeFileSync(
      join(backupDir, `products-${timestamp}.json`),
      JSON.stringify(productsData, null, 2)
    );
    console.log(`✓ Backed up ${productsData.length} products`);
    
    // Backup settings
    console.log("📦 Backing up settings...");
    const settingsData = await db.select().from(settings);
    writeFileSync(
      join(backupDir, `settings-${timestamp}.json`),
      JSON.stringify(settingsData, null, 2)
    );
    console.log(`✓ Backed up ${settingsData.length} settings records`);
    
    // Backup invoices
    console.log("📦 Backing up invoices...");
    const invoicesData = await db.select().from(invoices);
    writeFileSync(
      join(backupDir, `invoices-${timestamp}.json`),
      JSON.stringify(invoicesData, null, 2)
    );
    console.log(`✓ Backed up ${invoicesData.length} invoices`);
    
    // Create combined backup
    const fullBackup = {
      timestamp: new Date().toISOString(),
      users: usersData,
      products: productsData,
      settings: settingsData,
      invoices: invoicesData,
    };
    
    writeFileSync(
      join(backupDir, `full-backup-${timestamp}.json`),
      JSON.stringify(fullBackup, null, 2)
    );
    
    console.log("\n✅ Backup completed successfully!");
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${usersData.length}`);
    console.log(`   - Products: ${productsData.length}`);
    console.log(`   - Settings: ${settingsData.length}`);
    console.log(`   - Invoices: ${invoicesData.length}`);
    
    await client.end();
    
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backupData();
}

export { backupData };

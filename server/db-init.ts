/**
 * Database initialization and migration script
 * Run this once to set up PostgreSQL tables
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sql } from "drizzle-orm";

async function initializeDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");
  
  try {
    // Connect to PostgreSQL database
    const client = postgres(dbUrl, { 
      ssl: { rejectUnauthorized: false }, 
      max: 1,
    });
    const db = drizzle(client);

    console.log("✓ Connected to database");
    console.log("📦 Creating tables...");

    // Create tables using raw SQL based on schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        hsn_code TEXT DEFAULT '8708',
        stock INTEGER NOT NULL DEFAULT 0,
        purchase_price NUMERIC(10, 2) NOT NULL,
        selling_price NUMERIC(10, 2) NOT NULL,
        max_discount NUMERIC(5, 2) DEFAULT '0',
        gst_rate INTEGER NOT NULL DEFAULT 28
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_name TEXT DEFAULT 'Brothers Enterprises',
        shop_address TEXT DEFAULT '',
        shop_phone TEXT DEFAULT '+91 98765 43210',
        shop_gstin TEXT DEFAULT '29XXXXX1234X1Z5',
        custom_text_1 TEXT DEFAULT 'All goods once sold will not be taken back',
        custom_text_2 TEXT DEFAULT 'Warranty as per manufacturer terms',
        custom_text_3 TEXT DEFAULT 'Payment due within 30 days',
        logo_path TEXT DEFAULT '',
        signature_path TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        items TEXT NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        gst_amount NUMERIC(12, 2) NOT NULL,
        grand_total NUMERIC(12, 2) NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ Tables created successfully");
    
    // Add migration for existing tables - add new columns if they don't exist
    console.log("📦 Running migrations...");
    
    try {
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active INTEGER NOT NULL DEFAULT 1;
      `);
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;
      `);
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
      `);
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expiry TEXT;
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          sid varchar NOT NULL,
          sess json NOT NULL,
          expire timestamp(6) NOT NULL,
          CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire)
      `);
      console.log("✓ Email columns added to users and invoices tables");
      
      // Update existing users with default email
      await db.execute(sql`
        UPDATE users SET email = 'rr4180885@gmail.com' WHERE email = '' OR email IS NULL;
      `);
      console.log("✓ Default email set for existing users");
      
      console.log("✓ Migrations completed successfully");
    } catch (error) {
      console.log("⚠️  Migration warning (may be already applied):", error);
    }
    
    await client.end();
    console.log("✅ Database initialization complete");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };

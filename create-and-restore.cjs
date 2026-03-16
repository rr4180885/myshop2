/**
 * Create Tables and Restore Data - All in One
 */
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const NEON_URL = 'postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function createAndRestore() {
  console.log('🔌 Connecting to Neon...\n');
  
  const client = postgres(NEON_URL, { 
    ssl: { rejectUnauthorized: false }, 
    max: 1,
  });

  try {
    // Step 1: Create Tables
    console.log('🔧 STEP 1: Creating tables...\n');
    
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        reset_otp TEXT,
        reset_otp_expiry TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✓ users table created');
    
    await client`
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
      )
    `;
    console.log('   ✓ products table created');
    
    await client`
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
      )
    `;
    console.log('   ✓ settings table created');
    
    await client`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        items TEXT NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        gst_amount NUMERIC(12, 2) NOT NULL,
        grand_total NUMERIC(12, 2) NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✓ invoices table created\n');
    
    // Step 2: Load backup
    console.log('🔧 STEP 2: Loading backup data...\n');
    const backupDir = path.join(process.cwd(), 'backup');
    const files = fs.readdirSync(backupDir);
    const fullBackups = files.filter(f => f.startsWith('full-backup-'));
    
    if (fullBackups.length === 0) {
      console.log('❌ No backup found!');
      await client.end();
      return;
    }
    
    fullBackups.sort().reverse();
    const backup = JSON.parse(fs.readFileSync(path.join(backupDir, fullBackups[0]), 'utf-8'));
    
    let restored = { users: 0, products: 0, settings: 0, invoices: 0 };
    
    // Step 3: Restore users
    console.log(`📥 Restoring ${backup.users.length} users...`);
    for (const user of backup.users) {
      await client`
        INSERT INTO users ${client(user, 'id', 'username', 'password', 'email', 'is_active', 'reset_otp', 'reset_otp_expiry', 'created_at')}
        ON CONFLICT (username) DO NOTHING
      `;
      restored.users++;
    }
    console.log(`   ✓ ${restored.users} users restored`);
    
    // Step 4: Restore products
    console.log(`📥 Restoring ${backup.products.length} products...`);
    for (const product of backup.products) {
      await client`
        INSERT INTO products (name, brand, code, hsn_code, stock, purchase_price, selling_price, max_discount, gst_rate)
        VALUES (${product.name}, ${product.brand}, ${product.code}, ${product.hsn_code}, ${product.stock}, ${product.purchase_price}, ${product.selling_price}, ${product.max_discount}, ${product.gst_rate})
        ON CONFLICT (code) DO NOTHING
      `;
      restored.products++;
    }
    console.log(`   ✓ ${restored.products} products restored`);
    
    // Step 5: Restore settings
    console.log(`📥 Restoring ${backup.settings.length} settings...`);
    for (const setting of backup.settings) {
      await client`
        INSERT INTO settings (shop_name, shop_address, shop_phone, shop_gstin, custom_text_1, custom_text_2, custom_text_3, logo_path, signature_path)
        VALUES (${setting.shop_name}, ${setting.shop_address}, ${setting.shop_phone}, ${setting.shop_gstin}, ${setting.custom_text_1}, ${setting.custom_text_2}, ${setting.custom_text_3}, ${setting.logo_path || ''}, ${setting.signature_path || ''})
      `;
      restored.settings++;
    }
    console.log(`   ✓ ${restored.settings} settings restored`);
    
    // Step 6: Restore invoices
    console.log(`📥 Restoring ${backup.invoices.length} invoices...`);
    for (const invoice of backup.invoices) {
      await client`
        INSERT INTO invoices (invoice_number, customer_name, customer_phone, customer_email, items, subtotal, gst_amount, grand_total, created_at)
        VALUES (${invoice.invoice_number}, ${invoice.customer_name}, ${invoice.customer_phone}, ${invoice.customer_email || ''}, ${invoice.items}, ${invoice.subtotal}, ${invoice.gst_amount}, ${invoice.grand_total}, ${invoice.created_at})
        ON CONFLICT (invoice_number) DO NOTHING
      `;
      restored.invoices++;
    }
    console.log(`   ✓ ${restored.invoices} invoices restored\n`);
    
    console.log('=============================================');
    console.log('  ✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=============================================\n');
    console.log(`📊 Final Count:`);
    console.log(`   Users: ${restored.users}`);
    console.log(`   Products: ${restored.products}`);
    console.log(`   Settings: ${restored.settings}`);
    console.log(`   Invoices: ${restored.invoices}\n`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

createAndRestore();

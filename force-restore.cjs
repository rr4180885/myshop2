/**
 * Force Restore to Neon - Direct Script
 */
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const NEON_URL = 'postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function forceRestore() {
  console.log('🔌 Connecting to Neon...');
  
  const client = postgres(NEON_URL, { 
    ssl: { rejectUnauthorized: false }, 
    max: 1,
  });

  try {
    // Find the latest backup file
    const backupDir = path.join(process.cwd(), 'backup');
    const files = fs.readdirSync(backupDir);
    const fullBackups = files.filter(f => f.startsWith('full-backup-') && f.endsWith('.json'));
    
    if (fullBackups.length === 0) {
      throw new Error('No backup files found!');
    }
    
    fullBackups.sort().reverse();
    const latestBackup = fullBackups[0];
    
    console.log(`📦 Loading backup: ${latestBackup}`);
    const backupData = JSON.parse(fs.readFileSync(path.join(backupDir, latestBackup), 'utf-8'));
    
    let restored = { users: 0, products: 0, settings: 0, invoices: 0 };
    
    // Restore users
    if (backupData.users && backupData.users.length > 0) {
      console.log(`📥 Restoring ${backupData.users.length} users...`);
      for (const user of backupData.users) {
        try {
          await client`
            INSERT INTO users ${client(user, 'id', 'username', 'password', 'email', 'is_active', 'reset_otp', 'reset_otp_expiry', 'created_at')}
            ON CONFLICT (id) DO NOTHING
          `;
          restored.users++;
        } catch (error) {
          console.warn(`   ⚠️  Skipped user ${user.username}:`, error.message);
        }
      }
      console.log(`   ✓ Restored ${restored.users} users`);
    }
    
    // Restore products
    if (backupData.products && backupData.products.length > 0) {
      console.log(`📥 Restoring ${backupData.products.length} products...`);
      for (const product of backupData.products) {
        try {
          await client`
            INSERT INTO products ${client(product, 'id', 'name', 'brand', 'code', 'hsn_code', 'stock', 'purchase_price', 'selling_price', 'max_discount', 'gst_rate')}
            ON CONFLICT (code) DO NOTHING
          `;
          restored.products++;
        } catch (error) {
          console.warn(`   ⚠️  Skipped product ${product.code}:`, error.message);
        }
      }
      console.log(`   ✓ Restored ${restored.products} products`);
    }
    
    // Restore settings
    if (backupData.settings && backupData.settings.length > 0) {
      console.log(`📥 Restoring ${backupData.settings.length} settings...`);
      for (const setting of backupData.settings) {
        try {
          await client`
            INSERT INTO settings ${client(setting, 'id', 'shop_name', 'shop_address', 'shop_phone', 'shop_gstin', 'custom_text_1', 'custom_text_2', 'custom_text_3', 'logo_path', 'signature_path', 'updated_at')}
            ON CONFLICT (id) DO UPDATE SET
              shop_name = EXCLUDED.shop_name,
              shop_address = EXCLUDED.shop_address,
              shop_phone = EXCLUDED.shop_phone,
              shop_gstin = EXCLUDED.shop_gstin,
              custom_text_1 = EXCLUDED.custom_text_1,
              custom_text_2 = EXCLUDED.custom_text_2,
              custom_text_3 = EXCLUDED.custom_text_3,
              logo_path = EXCLUDED.logo_path,
              signature_path = EXCLUDED.signature_path
          `;
          restored.settings++;
        } catch (error) {
          console.warn(`   ⚠️  Skipped setting:`, error.message);
        }
      }
      console.log(`   ✓ Restored ${restored.settings} settings`);
    }
    
    // Restore invoices
    if (backupData.invoices && backupData.invoices.length > 0) {
      console.log(`📥 Restoring ${backupData.invoices.length} invoices...`);
      for (const invoice of backupData.invoices) {
        try {
          await client`
            INSERT INTO invoices ${client(invoice, 'id', 'invoice_number', 'customer_name', 'customer_phone', 'customer_email', 'items', 'subtotal', 'gst_amount', 'grand_total', 'created_at')}
            ON CONFLICT (invoice_number) DO NOTHING
          `;
          restored.invoices++;
        } catch (error) {
          console.warn(`   ⚠️  Skipped invoice ${invoice.invoice_number}:`, error.message);
        }
      }
      console.log(`   ✓ Restored ${restored.invoices} invoices`);
    }
    
    console.log(`\n✅ Restore completed!`);
    console.log(`   Users: ${restored.users}/${backupData.users.length}`);
    console.log(`   Products: ${restored.products}/${backupData.products.length}`);
    console.log(`   Settings: ${restored.settings}/${backupData.settings.length}`);
    console.log(`   Invoices: ${restored.invoices}/${backupData.invoices.length}\n`);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    await client.end();
    return false;
  }
}

forceRestore().then(success => {
  if (!success) process.exit(1);
});

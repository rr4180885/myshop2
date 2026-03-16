/**
 * Force Backup from Supabase - Direct Script
 */
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'postgresql://postgres.jrgjvlbztglybkslcthl:Rakesh@7257Ranjan@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

async function forceBackup() {
  console.log('🔌 Connecting to Supabase...');
  
  const client = postgres(SUPABASE_URL, { 
    ssl: { rejectUnauthorized: false }, 
    max: 1,
    prepare: false,
  });

  try {
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Backup users
    console.log('📦 Backing up users...');
    const users = await client`SELECT * FROM users`;
    console.log(`   Found ${users.length} users`);
    
    // Backup products
    console.log('📦 Backing up products...');
    const products = await client`SELECT * FROM products`;
    console.log(`   Found ${products.length} products`);
    
    // Backup settings
    console.log('📦 Backing up settings...');
    const settings = await client`SELECT * FROM settings`;
    console.log(`   Found ${settings.length} settings`);
    
    // Backup invoices
    console.log('📦 Backing up invoices...');
    const invoices = await client`SELECT * FROM invoices`;
    console.log(`   Found ${invoices.length} invoices`);
    
    // Create full backup
    const fullBackup = {
      timestamp: new Date().toISOString(),
      users,
      products,
      settings,
      invoices,
    };
    
    const filename = path.join(backupDir, `full-backup-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(fullBackup, null, 2));
    
    console.log(`\n✅ Backup completed!`);
    console.log(`   File: ${filename}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Settings: ${settings.length}`);
    console.log(`   Invoices: ${invoices.length}\n`);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    await client.end();
    return false;
  }
}

forceBackup().then(success => {
  if (!success) process.exit(1);
});

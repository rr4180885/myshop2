/**
 * Verify Neon Database Content
 */
const postgres = require('postgres');

const NEON_URL = 'postgresql://neondb_owner:npg_CWSQ75NrJRau@ep-cool-rain-adxklzhu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function verifyNeon() {
  console.log('🔌 Connecting to Neon...\n');
  
  const client = postgres(NEON_URL, { 
    ssl: { rejectUnauthorized: false }, 
    max: 1,
  });

  try {
    // List all tables
    console.log('📋 Checking tables...');
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    if (tables.length === 0) {
      console.log('\n❌ NO TABLES FOUND! Database is empty.\n');
      await client.end();
      return;
    }
    
    // Count records in each table
    console.log('\n📊 Record counts:');
    
    try {
      const users = await client`SELECT COUNT(*) as count FROM users`;
      console.log(`   Users: ${users[0].count}`);
    } catch (e) {
      console.log(`   Users: Table not found`);
    }
    
    try {
      const products = await client`SELECT COUNT(*) as count FROM products`;
      console.log(`   Products: ${products[0].count}`);
    } catch (e) {
      console.log(`   Products: Table not found`);
    }
    
    try {
      const settings = await client`SELECT COUNT(*) as count FROM settings`;
      console.log(`   Settings: ${settings[0].count}`);
    } catch (e) {
      console.log(`   Settings: Table not found`);
    }
    
    try {
      const invoices = await client`SELECT COUNT(*) as count FROM invoices`;
      console.log(`   Invoices: ${invoices[0].count}`);
    } catch (e) {
      console.log(`   Invoices: Table not found`);
    }
    
    console.log('\n');
    await client.end();
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await client.end();
  }
}

verifyNeon();

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkStores() {
  try {
    console.log('🏪 Checking available stores...\n');
    
    const result = await pool.query('SELECT * FROM stores ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('❌ No stores found');
    } else {
      console.log(`📊 Found ${result.rows.length} stores:\n`);
      result.rows.forEach(row => {
        console.log(`   • ID: ${row.id} | Name: ${row.name} | User: ${row.user_id}`);
      });
    }
    
    // Also check topup companies
    console.log('\n🏢 Checking topup companies...\n');
    const companies = await pool.query('SELECT * FROM topup_companies ORDER BY id');
    
    if (companies.rows.length === 0) {
      console.log('❌ No companies found');
    } else {
      console.log(`📊 Found ${companies.rows.length} companies:\n`);
      companies.rows.forEach(row => {
        console.log(`   • ID: ${row.id} | Store: ${row.store_id} | Name: ${row.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStores();

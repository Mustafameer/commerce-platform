import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkCategories() {
  try {
    console.log('🔍 Checking topup product categories...\n');
    
    const result = await pool.query(`
      SELECT * FROM topup_product_categories ORDER BY id
    `);
    
    console.log(`📊 Found ${result.rows.length} categories:\n`);
    result.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCategories();

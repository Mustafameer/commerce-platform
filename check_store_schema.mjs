import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkStoreSchema() {
  try {
    console.log('🔍 Checking stores table schema...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'stores'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Stores table columns:\n');
    result.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? '[nullable]' : '[NOT NULL]'}`);
    });
    
    console.log('\n🔍 Sample data from stores:\n');
    const data = await pool.query('SELECT * FROM stores LIMIT 2');
    data.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStoreSchema();

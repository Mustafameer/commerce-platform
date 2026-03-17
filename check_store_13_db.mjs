import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/multi_ecommerce'
});

async function checkStore() {
  try {
    const result = await pool.query(
      'SELECT id, store_name, is_active, status FROM stores WHERE id = 13'
    );
    
    console.log('Store 13:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStore();

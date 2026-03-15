import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createImageTable() {
  try {
    console.log('📋 Creating topup_product_images table...\n');
    
    const createTable = `
      CREATE TABLE IF NOT EXISTS topup_product_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, product_id, image_data)
      );
      
      CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product 
        ON topup_product_images(store_id, product_id);
      
      CREATE INDEX IF NOT EXISTS idx_topup_product_images_created 
        ON topup_product_images(created_at);
    `;
    
    await pool.query(createTable);
    console.log('✅ Table created successfully\n');
    
    // Check if table exists
    const checkTable = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_product_images'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Table columns:\n');
    checkTable.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createImageTable();

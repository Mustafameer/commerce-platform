import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixAndCreate() {
  try {
    console.log('🔨 Starting database fix and table creation...');
    
    // Check tables in public schema
    const allTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tableList = allTables.rows.map(r => r.table_name);
    console.log('Existing public tables:', tableList);

    // Create topup_products WITHOUT foreign keys first if they fail
    console.log('Creating topup_products table...');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS topup_products (
            id SERIAL PRIMARY KEY,
            store_id INTEGER,
            company_id INTEGER,
            category_id INTEGER,
            amount VARCHAR(255),
            price DECIMAL(10,2),
            retail_price DECIMAL(10,2),
            wholesale_price DECIMAL(10,2),
            available_codes INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ topup_products ensured.');

    // Drop old table if it exists to avoid conflicts
    console.log('Re-creating topup_product_images...');
    await pool.query(`DROP TABLE IF EXISTS topup_product_images`);
    
    await pool.query(`
      CREATE TABLE topup_product_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ SUCCESS: topup_product_images created.');
    
  } catch (err) {
    console.error('❌ Critical Error:', err.message);
  } finally {
    await pool.end();
  }
}
fixAndCreate();
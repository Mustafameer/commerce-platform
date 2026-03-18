import pg from 'pg';

const { Pool } = pg;

// Use Railway DATABASE_URL directly
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function createMissingTables() {
  try {
    console.log('🔍 Checking for missing tables...\n');

    // Check if topup_product_images exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'topup_product_images'
      )
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ topup_product_images table already exists');
    } else {
      console.log('❌ topup_product_images table NOT FOUND - Creating it now...\n');

      // Create the table
      await pool.query(`
        CREATE TABLE topup_product_images (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
          image_url TEXT,
          image_hash VARCHAR(255) NOT NULL,
          image_data TEXT,
          image_type VARCHAR(50) DEFAULT 'svg',
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, product_id, image_hash)
        )
      `);

      console.log('✅ topup_product_images table CREATED successfully!');

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product 
        ON topup_product_images(store_id, product_id)
      `);
      console.log('✅ Index created: idx_topup_product_images_store_product');

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_topup_product_images_created 
        ON topup_product_images(created_at)
      `);
      console.log('✅ Index created: idx_topup_product_images_created');
    }

    console.log('\n✅ Database structure verified!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createMissingTables();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function setupImageTables() {
  try {
    console.log('\n📸 Setting up Product Image Tables\n');

    // 1. Create product_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'jpeg',
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER REFERENCES users(id)
      )
    `);
    console.log('✅ Created product_images table');

    // 2. Create store_product_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_product_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'jpeg',
        file_size INTEGER,
        position INTEGER DEFAULT 0,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created store_product_images table');

    // 3. Create promotional_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promotional_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        image_type VARCHAR(50) DEFAULT 'jpeg',
        file_size INTEGER,
        position INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created promotional_images table');

    // 4. Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_product_store 
      ON product_images(store_id, product_id)
    `);
    console.log('✅ Created indexes for product_images');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_store_product_images 
      ON store_product_images(store_id, product_id, position)
    `);
    console.log('✅ Created indexes for store_product_images');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_promotional_images_store 
      ON promotional_images(store_id, is_active)
    `);
    console.log('✅ Created indexes for promotional_images');

    console.log('\n🎉 Image tables setup complete!\n');
    
    // 5. Get image counts
    const imgCount = await pool.query('SELECT COUNT(*) as c FROM product_images');
    const storeImgCount = await pool.query('SELECT COUNT(*) as c FROM store_product_images');
    const promoCount = await pool.query('SELECT COUNT(*) as c FROM promotional_images');
    
    console.log('📊 Current Image Data:');
    console.log(`   product_images: ${imgCount.rows[0].c} rows`);
    console.log(`   store_product_images: ${storeImgCount.rows[0].c} rows`);
    console.log(`   promotional_images: ${promoCount.rows[0].c} rows`);
    
    pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    pool.end();
  }
}

setupImageTables();

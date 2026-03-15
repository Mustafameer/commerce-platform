import pkg from 'pg';

const { Pool } = pkg;

// Railway Database
const pool = new Pool({
  connectionString: 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkAndAddData() {
  try {
    console.log('🚀 Checking Railway database...\n');
    
    // Check store 13
    const store13 = await pool.query('SELECT * FROM stores WHERE id = 13');
    console.log('📍 Store 13 status:', store13.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');
    
    // Check companies for store 13
    const companies = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = 13');
    console.log('🏢 Companies in store 13:', companies.rows[0].count);
    
    // Check products for store 13
    const products = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13');
    console.log('📦 Products in store 13:', products.rows[0].count);
    
    // Check topup_product_images table
    const imagesTable = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'topup_product_images'
      )
    `);
    console.log('📸 topup_product_images table:', imagesTable.rows[0].exists ? '✅ EXISTS' : '❌ MISSING');
    
    if (!imagesTable.rows[0].exists) {
      console.log('\n🔨 Creating topup_product_images table...');
      
      await pool.query(`
        CREATE TABLE topup_product_images (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
          image_data TEXT NOT NULL,
          image_type VARCHAR(50) DEFAULT 'svg',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, product_id, image_data)
        )
      `);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product ON topup_product_images(store_id, product_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_created ON topup_product_images(created_at)`);
      
      console.log('✅ Table created successfully!\n');
    }
    
    // If store 13 exists and has products but no images, copy from products array
    if (products.rows[0].count > 0) {
      console.log('\n📸 Copying images from topup_products...');
      
      const productsWithImages = await pool.query(`
        SELECT id, store_id, images 
        FROM topup_products 
        WHERE store_id = 13 AND images IS NOT NULL AND array_length(images, 1) > 0
      `);
      
      let totalImages = 0;
      
      for (const product of productsWithImages.rows) {
        if (Array.isArray(product.images)) {
          for (const imageData of product.images) {
            try {
              await pool.query(`
                INSERT INTO topup_product_images (store_id, product_id, image_data, image_type)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
              `, [product.store_id, product.id, imageData, 'svg']);
              
              totalImages++;
            } catch (err) {
              // Ignore duplicates
            }
          }
        }
      }
      
      console.log(`✅ Copied ${totalImages} images to topup_product_images\n`);
    }
    
    // Final status
    console.log('\n📊 FINAL STATUS:');
    console.log('═══════════════════════════════════');
    
    const finalStore = await pool.query('SELECT id, store_name FROM stores WHERE id = 13');
    const finalCompanies = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = 13');
    const finalProducts = await pool.query('SELECT COUNT(*) FROM topup_products WHERE store_id = 13');
    const finalImages = await pool.query('SELECT COUNT(*) FROM topup_product_images');
    
    if (finalStore.rows.length > 0) {
      console.log(`✅ Store 13: ${finalStore.rows[0].store_name}`);
    } else {
      console.log('❌ Store 13: NOT FOUND');
    }
    
    console.log(`✅ Companies: ${finalCompanies.rows.length}`);
    console.log(`✅ Products: ${finalProducts.rows[0].count}`);
    console.log(`✅ Images: ${finalImages.rows[0].count}`);
    console.log('═══════════════════════════════════\n');
    
    console.log('🎉 Railway database ready for TopupStorefront!');
    
  } catch (error) {
    console.error('❌ Error:', (error as any).message);
    if ((error as any).detail) {
      console.error('   Details:', (error as any).detail);
    }
  } finally {
    await pool.end();
  }
}

checkAndAddData();

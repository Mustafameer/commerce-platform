import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrateImages() {
  try {
    console.log('📸 Migrating images from topup_products to topup_product_images...\n');
    
    // Get all products with images
    const products = await pool.query(`
      SELECT id, store_id, images 
      FROM topup_products 
      WHERE images IS NOT NULL AND array_length(images, 1) > 0
    `);
    
    console.log(`📊 Found ${products.rows.length} products with images\n`);
    
    let totalImages = 0;
    
    for (const product of products.rows) {
      const { id, store_id, images } = product;
      
      if (!Array.isArray(images) || images.length === 0) continue;
      
      console.log(`🔄 Processing product ${id} (store ${store_id}): ${images.length} images`);
      
      // Insert each image
      for (const imageData of images) {
        try {
          await pool.query(`
            INSERT INTO topup_product_images (store_id, product_id, image_data, image_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [store_id, id, imageData, 'svg']);
          
          totalImages++;
        } catch (err) {
          console.error(`   ⚠️  Error inserting image: ${err.message}`);
        }
      }
    }
    
    console.log(`\n✅ Migration complete!\n   • Total images migrated: ${totalImages}`);
    console.log('   • Products still have original images for backward compatibility');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

migrateImages();

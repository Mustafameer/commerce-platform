import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Local database
const localPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

// Railway database
const railwayPool = new Pool({
  connectionString: 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway',
  ssl: { rejectUnauthorized: false }
});

async function migrateImagesToRailway() {
  try {
    console.log('🚀 Migrating images from LOCAL to RAILWAY...\n');
    
    // Get all images from local database
    const localImages = await localPool.query(`
      SELECT store_id, product_id, image_data, image_type
      FROM topup_product_images 
      ORDER BY created_at ASC
    `);
    
    console.log(`📊 Found ${localImages.rows.length} images in local database\n`);
    
    if (localImages.rows.length === 0) {
      console.log('ℹ️  No images to migrate');
      return;
    }
    
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    for (const image of localImages.rows) {
      try {
        const result = await railwayPool.query(`
          INSERT INTO topup_product_images (store_id, product_id, image_data, image_type)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [image.store_id, image.product_id, image.image_data, image.image_type]);
        
        if (result.rows.length > 0) {
          insertedCount++;
          process.stdout.write(`\r✅ Inserted: ${insertedCount}`);
        } else {
          duplicateCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`\n⚠️  Error inserting image: ${err}`);
      }
    }
    
    console.log(`\n\n📊 Migration Results:`);
    console.log(`   ✅ Inserted: ${insertedCount}`);
    console.log(`   ⏭️  Duplicates skipped: ${duplicateCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n🎉 Migration complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await localPool.end();
    await railwayPool.end();
  }
}

migrateImagesToRailway();

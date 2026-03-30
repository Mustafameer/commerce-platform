import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function repopulateImages() {
  try {
    console.log('📝 Repopulating topup_product_images with correct URLs...\n');
    
    const basePath = path.join(process.cwd(), 'public', 'uploads', 'topup');
    let totalAdded = 0;
    
    // Scan all product directories
    if (fs.existsSync(basePath)) {
      const storeIds = fs.readdirSync(basePath).filter(item => !isNaN(parseInt(item)));
      
      for (const storeFolder of storeIds) {
        const storeId = parseInt(storeFolder);
        const storePath = path.join(basePath, storeFolder);
        
        const productIds = fs.readdirSync(storePath).filter(item => {
          const stat = fs.statSync(path.join(storePath, item));
          return stat.isDirectory() && !isNaN(parseInt(item));
        });
        
        for (const productFolder of productIds) {
          const productId = parseInt(productFolder);
          const productPath = path.join(storePath, productFolder);
          
          const files = fs.readdirSync(productPath).filter(file => {
            const stat = fs.statSync(path.join(productPath, file));
            return stat.isFile();
          });
          
          for (const fileName of files) {
            const imageUrl = `/uploads/topup/${storeId}/${productId}/${fileName}`;
            
            try {
              const result = await pool.query(`
                INSERT INTO topup_product_images 
                (topup_product_id, image_url)
                VALUES ($1, $2)
                RETURNING id
              `, [productId, imageUrl]);
              
              totalAdded++;
              if (totalAdded % 5 === 0) {
                console.log(`  ✓ Added ${totalAdded} images...`);
              }
            } catch (e) {
              console.error(`  ❌ Failed to add ${imageUrl}:`, e.message);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Successfully added ${totalAdded} images to database\n`);
    
    // Verify
    const final = await pool.query(`
      SELECT COUNT(*) as cnt FROM topup_product_images
    `);
    
    console.log(`📊 Final database image count: ${final.rows[0].cnt}`);
    
    // Show sample
    const sample = await pool.query(`
      SELECT id, topup_product_id, image_url
      FROM topup_product_images
      LIMIT 5
    `);
    
    console.log('\n📸 Sample images:\n');
    sample.rows.forEach(row => {
      console.log(`  ID ${row.id}: Product ${row.topup_product_id}`);
      console.log(`    URL: ${row.image_url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

repopulateImages();

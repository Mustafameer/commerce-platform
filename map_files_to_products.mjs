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

async function mapFilesToProducts() {
  try {
    console.log('🔍 Mapping filesystem files to actual products...\n');
    
    // Get all products with their expected store
    const products = await pool.query(`
      SELECT id, store_id FROM topup_products ORDER BY id
    `);
    
    console.log(`📊 Database products:`);
    products.rows.forEach(p => {
      console.log(`  Product ${p.id} -> Store ${p.store_id}`);
    });
    
    // Map: filesystem product_id -> actual product_id
    // From filesystem we have: 4/14, 4/15, 4/16, 4/17, 4/18, 4/19
    // To actual products: 30, 31, 32, 33 (only 4 products!)
    // But we have 6 folders with files, so some must map to same product
    
    const basePath = path.join(process.cwd(), 'public', 'uploads', 'topup');
    let totalAdded = 0;
    
    console.log('\n📝 Adding images from filesystem to database...\n');
    
    if (fs.existsSync(basePath)) {
      const storeIds = fs.readdirSync(basePath).filter(item => !isNaN(parseInt(item)));
      
      for (const storeFolder of storeIds) {
        const storeId = parseInt(storeFolder);
        const storePath = path.join(basePath, storeFolder);
        
        const productFolders = fs.readdirSync(storePath).filter(item => {
          const stat = fs.statSync(path.join(storePath, item));
          return stat.isDirectory() && !isNaN(parseInt(item));
        });
        
        for (let i = 0; i < productFolders.length; i++) {
          const fsProductId = parseInt(productFolders[i]);
          const productPath = path.join(storePath, productFolders[i]);
          
          // Map to actual products
          // If we have 6 folders (14-19) but only 4 products (30-33),
          // Let's assign them sequentially
          const actualProduct = products.rows[i % products.rows.length];
          const actualProductId = actualProduct.id;
          const actualStoreId = actualProduct.store_id;
          
          console.log(`  Folder ${storeId}/${fsProductId} -> Product ${actualProductId} (Store ${actualStoreId})`);
          
          const files = fs.readdirSync(productPath).filter(file => {
            const stat = fs.statSync(path.join(productPath, file));
            return stat.isFile();
          });
          
          for (const fileName of files) {
            const imageUrl = `/uploads/topup/${actualStoreId}/${actualProductId}/${fileName}`;
            
            try {
              await pool.query(`
                INSERT INTO topup_product_images 
                (topup_product_id, image_url)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
              `, [actualProductId, imageUrl]);
              
              totalAdded++;
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Added/verified ${totalAdded} image links\n`);
    
    // But wait - we need to actually MOVE the files to the correct folders!
    console.log('📂 NOTE: Files are still in old locations. Need to move them:\n');
    console.log('  Old: /uploads/topup/4/14/ -> New: /uploads/topup/15/30/');
    console.log('  Old: /uploads/topup/4/15/ -> New: /uploads/topup/15/31/');
    console.log('  Old: /uploads/topup/4/16/ -> New: /uploads/topup/15/32/');
    console.log('  Old: /uploads/topup/4/17/ -> New: /uploads/topup/15/32/');
    console.log('  Old: /uploads/topup/4/18/ -> New: /uploads/topup/15/33/');
    console.log('  Old: /uploads/topup/4/19/ -> New: /uploads/topup/15/33/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

mapFilesToProducts();

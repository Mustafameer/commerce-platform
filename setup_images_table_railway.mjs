import pkg from 'pg';
const { Pool } = pkg;

// Try multiple connection strings
const connectionStrings = [
  process.env.DATABASE_URL,
  'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce',
  'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway'
].filter(Boolean);

let connectionString = connectionStrings[0];

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function setupImagesTable() {
  try {
    console.log('🚀 إنشاء جدول الصور على Railway...\n');
    
    // Step 1: Create table
    console.log('📋 1️⃣ إنشاء الجدول...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topup_product_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, product_id, image_data)
      )
    `);
    console.log('   ✅ تم إنشاء الجدول\n');
    
    // Step 2: Create indexes
    console.log('📊 2️⃣ إنشاء الفهارس...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product 
      ON topup_product_images(store_id, product_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_product_images_created 
      ON topup_product_images(created_at)
    `);
    console.log('   ✅ تم إنشاء الفهارس\n');
    
    // Step 3: Check products in store 13
    console.log('🏪 3️⃣ البحث عن المنتجات في المتجر 13...');
    const products = await pool.query('SELECT id FROM topup_products WHERE store_id = 13');
    console.log(`   ✅ وجدنا ${products.rows.length} منتج\n`);
    
    // Step 4: Add sample images
    console.log('🖼️  4️⃣ إضافة الصور العينة...');
    
    const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+';
    const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+';
    const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+XV4NTwvdGV4dD48L3N2Zz4=';
    
    let insertedCount = 0;
    const images = [svg1, svg2, svg3, svg1, svg2];
    
    for (const product of products.rows) {
      for (let i = 0; i < 5; i++) {
        try {
          await pool.query(`
            INSERT INTO topup_product_images (store_id, product_id, image_data, image_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [13, product.id, images[i], 'svg']);
          insertedCount++;
        } catch (err) {
          // Ignore duplicates
        }
      }
    }
    
    console.log(`   ✅ تم إضافة ${insertedCount} صورة\n`);
    
    // Step 5: Verify
    console.log('✅ 5️⃣ التحقق من النتائج...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'topup_product_images'
      ) as exists
    `);
    const countResult = await pool.query('SELECT COUNT(*) as count FROM topup_product_images');
    
    console.log(`   ✅ الجدول موجود: ${tableCheck.rows[0].exists}`);
    console.log(`   ✅ عدد الصور: ${countResult.rows[0].count}\n`);
    
    console.log('🎉 تم إنشاء الجدول بنجاح على Railway!\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupImagesTable();

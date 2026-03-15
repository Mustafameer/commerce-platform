import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function addTestProducts() {
  try {
    console.log('🔧 إضافة منتجات تجريبية لـ store 1\n');
    
    // أولاً: تحقق من الشركات
    const companies = await pool.query('SELECT * FROM topup_companies WHERE store_id = 1');
    console.log(`✅ الشركات في store 1: ${companies.rows.length}`);
    companies.rows.forEach(c => console.log(`   - ID: ${c.id} | Name: ${c.name}`));
    
    if (companies.rows.length === 0) {
      console.log('\n❌ لا توجد شركات! سأضيفها الآن...');
      
      const addCompanies = await pool.query(`
        INSERT INTO topup_companies (store_id, name, logo_url)
        VALUES 
          (1, 'زين أثير', 'https://via.placeholder.com/100?text=Zain'),
          (1, 'آسيا سيل', 'https://via.placeholder.com/100?text=Asiacell'),
          (1, 'كورك', 'https://via.placeholder.com/100?text=Korek')
        RETURNING *
      `);
      console.log(`✅ تم إضافة ${addCompanies.rowCount} شركات`);
    }
    
    // ثانياً: أضف منتجات مع صور
    console.log('\n🔧 إضافة منتجات...');
    
    const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4zNTAwMDwvdGV4dD48L3N2Zz4=';
    const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4yNTAwMDwvdGV4dD48L3N2Zz4=';
    const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4xNTAwMDwvdGV4dD48L3N2Zz4=';
    
    const products = await pool.query(`
      DELETE FROM topup_products WHERE store_id = 1;
      
      INSERT INTO topup_products (store_id, company_id, amount, price, retail_price, wholesale_price, images, is_active)
      VALUES 
        (1, (SELECT id FROM topup_companies WHERE store_id = 1 AND name = 'زين أثير' LIMIT 1), 
         35000, 40000, 38000, 37000, 
         ARRAY['${svg1}', '${svg2}', '${svg3}', '${svg1}', '${svg2}']::text[], true),
        
        (1, (SELECT id FROM topup_companies WHERE store_id = 1 AND name = 'آسيا سيل' LIMIT 1), 
         25000, 27500, 26500, 26000, 
         ARRAY['${svg3}', '${svg1}', '${svg2}', '${svg3}', '${svg1}', '${svg2}', '${svg3}']::text[], true),
        
        (1, (SELECT id FROM topup_companies WHERE store_id = 1 AND name = 'كورك' LIMIT 1), 
         15000, 17500, 16500, 16000, 
         ARRAY['${svg2}', '${svg3}', '${svg1}', '${svg2}', '${svg3}']::text[], true)
      RETURNING id, company_id, amount, price, array_length(images, 1) as images_count
    `);
    
    console.log(`✅ تم إضافة المنتجات:`);
    products.rows.forEach(p => {
      console.log(`   - ID: ${p.id} | Amount: ${p.amount} | Price: ${p.price} | Images: ${p.images_count}`);
    });
    
    console.log('\n✅ تم التحديث بنجاح!');
    
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

addTestProducts();

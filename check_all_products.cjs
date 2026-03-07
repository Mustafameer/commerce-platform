const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // عرض جميع المنتجات
    const result = await pool.query(`
      SELECT id, store_id, name, price
      FROM products
      ORDER BY store_id, id
    `);
    
    console.log('=== جميع المنتجات في جدول products ===');
    console.log(`الإجمالي: ${result.rows.length}`);
    
    // تجميع حسب المتجر
    const byStore = {};
    result.rows.forEach(p => {
      if (!byStore[p.store_id]) byStore[p.store_id] = [];
      byStore[p.store_id].push(p);
    });
    
    Object.entries(byStore).forEach(([storeId, products]) => {
      console.log(`\n📦 المتجر ${storeId}: ${products.length} منتج`);
      products.forEach(p => {
        console.log(`  - ID: ${p.id} | ${p.name} | ${p.price}`);
      });
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

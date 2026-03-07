const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // عرض المنتجات في جدول products للمتجر 13
    const result = await pool.query(`
      SELECT id, store_id, category_id, name, price
      FROM products
      WHERE store_id = 13
      ORDER BY id
    `);
    
    console.log('=== المنتجات في جدول products (للمتجر 13) ===');
    console.log(`العدد: ${result.rows.length}`);
    result.rows.forEach(p => {
      console.log(`ID: ${p.id} | Store: ${p.store_id} | Category: ${p.category_id} | ${p.name} | السعر: ${p.price}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

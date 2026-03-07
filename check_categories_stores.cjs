const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkAll() {
  try {
    console.log('=== جدول categories (الفئات العام) ===\n');
    const categoriesRes = await pool.query(`
      SELECT * FROM categories ORDER BY id DESC LIMIT 10
    `);
    console.log(`إجمالي: ${categoriesRes.rows.length}`);
    categoriesRes.rows.forEach(c => {
      console.log(`  📁 ID ${c.id}: Store ${c.store_id} | "${c.name}"`);
    });

    console.log('\n=== جدول stores (المتاجر الرئيسية) ===\n');
    const storesRes = await pool.query(`
      SELECT * FROM stores WHERE id IN (1, 3, 8, 13) ORDER BY id
    `);
    storesRes.rows.forEach(s => {
      console.log(`  🏪 ID ${s.id}: "${s.title}"`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAll();

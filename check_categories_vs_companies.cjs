const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    console.log('=== جميع الأقسام في جدول categories للمتجر 13 ===\n');

    const categoriesRes = await pool.query(`
      SELECT * FROM categories WHERE store_id = 13 ORDER BY id
    `);
    console.log(`إجمالي الأقسام: ${categoriesRes.rows.length}`);
    categoriesRes.rows.forEach(c => {
      console.log(`  - ID ${c.id}: ${c.name}`);
    });

    console.log('\n=== جميع الشركات في topup_companies للمتجر 13 ===\n');
    const companiesRes = await pool.query(`
      SELECT * FROM topup_companies WHERE store_id = 13 ORDER BY id
    `);
    console.log(`إجمالي الشركات: ${companiesRes.rows.length}`);
    companiesRes.rows.forEach(c => {
      console.log(`  - ID ${c.id}: ${c.name}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

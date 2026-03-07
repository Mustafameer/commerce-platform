const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    console.log('=== فحص بيانات topup_companies ===\n');

    // جميع الشركات
    const allRes = await pool.query(`
      SELECT id, store_id, name, is_active FROM topup_companies ORDER BY store_id, id
    `);
    console.log(`إجمالي الشركات: ${allRes.rows.length}`);
    allRes.rows.forEach(c => {
      const status = c.is_active ? '✅' : '❌';
      console.log(`  ${status} ID ${c.id} | Store ${c.store_id}: ${c.name}`);
    });

    console.log('\n=== فحص الشركات حسب المتجر ===\n');
    const storesRes = await pool.query(`
      SELECT DISTINCT store_id FROM topup_companies ORDER BY store_id
    `);
    for (const row of storesRes.rows) {
      const storeId = row.store_id;
      const companiesRes = await pool.query(
        `SELECT * FROM topup_companies WHERE store_id = $1 ORDER BY id`,
        [storeId]
      );
      console.log(`Store ${storeId}: ${companiesRes.rows.length} شركة`);
      companiesRes.rows.forEach(c => console.log(`  - ${c.name}`));
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

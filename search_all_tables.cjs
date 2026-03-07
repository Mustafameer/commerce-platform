const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkStores() {
  try {
    console.log('=== البحث في جدول topup_companies ===\n');

    const topupCompaniesRes = await pool.query(`
      SELECT id, store_id, name, is_active FROM topup_companies ORDER BY id
    `);
    console.log(`إجمالي الشركات: ${topupCompaniesRes.rows.length}`);
    topupCompaniesRes.rows.forEach(c => {
      const status = c.is_active ? '✅' : '❌';
      console.log(`  ${status} ID ${c.id} | Store ${c.store_id}: ${c.name}`);
    });

    console.log('\n=== البحث في جدول topup_product_categories ===\n');
    const topupCategoriesRes = await pool.query(`
      SELECT id, store_id, name, is_active FROM topup_product_categories ORDER BY id
    `);
    console.log(`إجمالي الفئات: ${topupCategoriesRes.rows.length}`);
    topupCategoriesRes.rows.forEach(c => {
      const status = c.is_active ? '✅' : '❌';
      console.log(`  ${status} ID ${c.id} | Store ${c.store_id}: ${c.name}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStores();

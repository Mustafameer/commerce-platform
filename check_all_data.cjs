const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkAll() {
  try {
    console.log('=== جميع الشركات في قاعدة البيانات ===\n');

    const companiesRes = await pool.query(`
      SELECT id, store_id, name, is_active 
      FROM topup_companies 
      ORDER BY id
    `);
    console.log(`إجمالي الشركات: ${companiesRes.rows.length}`);
    companiesRes.rows.forEach(c => {
      const active = c.is_active ? '✅' : '❌';
      console.log(`  ${active} ID ${c.id} | Store ${c.store_id}: ${c.name}`);
    });

    console.log('\n=== جميع الفئات في قاعدة البيانات ===\n');
    
    const categoriesRes = await pool.query(`
      SELECT id, store_id, name, is_active 
      FROM topup_product_categories 
      ORDER BY id
    `);
    console.log(`إجمالي الفئات: ${categoriesRes.rows.length}`);
    categoriesRes.rows.forEach(c => {
      const active = c.is_active ? '✅' : '❌';
      console.log(`  ${active} ID ${c.id} | Store ${c.store_id}: ${c.name}`);
    });

    console.log('\n=== فلتر: الشركات النشطة للمتجر 13 ===\n');
    const activeCompanies = await pool.query(`
      SELECT id, store_id, name, is_active 
      FROM topup_companies 
      WHERE store_id = 13 AND is_active = true
      ORDER BY id
    `);
    console.log(`${activeCompanies.rows.length} شركة نشطة`);
    activeCompanies.rows.forEach(c => console.log(`  ✅ ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAll();

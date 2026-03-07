const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    console.log('=== بيانات المنتجات للمتجر 13 ===\n');

    const productsRes = await pool.query(`
      SELECT tp.*, tc.name as company_name
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);

    console.log(`📦 إجمالي المنتجات: ${productsRes.rows.length}`);
    productsRes.rows.forEach(p => {
      console.log(`  - ID ${p.id}: Company ${p.company_name} | ${p.amount} دينار`);
    });

    console.log('\n=== الشركات ===');
    const companiesRes = await pool.query(`
      SELECT * FROM topup_companies WHERE store_id = 13
    `);
    console.log(`الشركات: ${companiesRes.rows.length}`);
    companiesRes.rows.forEach(c => console.log(`  - ${c.id}: ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

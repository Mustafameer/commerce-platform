const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // عرض جميع المنتجات (بغض النظر عن is_active)
    const result = await pool.query(`
      SELECT tp.id, tp.is_active, tc.name as company, tpc.name as category, tp.amount
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    
    console.log('=== جميع المنتجات (مع is_active status) ===');
    result.rows.forEach(p => {
      const status = p.is_active ? '✅' : '❌';
      console.log(`${status} ID: ${p.id} | ${p.company} | ${p.category} | ${p.amount}`);
    });
    
    console.log('\n=== المنتجات النشطة فقط (is_active = true) ===');
    const active = result.rows.filter(p => p.is_active);
    console.log(`العدد: ${active.length}`);
    active.forEach(p => {
      console.log(`ID: ${p.id} | ${p.company} | ${p.category}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();

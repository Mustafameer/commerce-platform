import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function test() {
  try {
    console.log('\n📊 TOPUP DATA CHECK\n');

    // Products
    const prod = await pool.query(`
      SELECT tp.id, tp.amount, tp.price, tp.is_active, tc.name
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    
    console.log(`✅ Products: ${prod.rows.length}`);
    prod.rows.forEach(p => console.log(`   - ${p.name}: ${p.amount} SAR (${p.is_active ? 'Active' : 'Inactive'})`));
    
    // Images
    const img = await pool.query('SELECT COUNT(*) as c FROM topup_product_images');
    console.log(`\n✅ Images: ${img.rows[0].c}`);
    
    console.log('\n');
    pool.end();
  } catch (e) {
    console.error(e.message);
    pool.end();
  }
}

test();

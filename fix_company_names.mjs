import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function fixCompanyNames() {
  try {
    console.log('📝 === FIXING COMPANY NAMES TO ARABIC ===\n');

    const updates = [
      { id: 1, new_name: 'زين' },
      { id: 2, new_name: 'آسيا سيل' },
      { id: 3, new_name: 'أوريدو' },
      { id: 4, new_name: 'هالو تل' }
    ];

    for (let comp of updates) {
      await pool.query(
        `UPDATE topup_companies SET name = $1 WHERE store_id = 13 AND id = $2`,
        [comp.new_name, comp.id]
      );
      console.log(`   ✅ Updated company ${comp.id} → ${comp.new_name}`);
    }

    console.log('\n✅ Company names fixed!\n');
    console.log('📊 Verifying...\n');

    // Verify
    const result = await pool.query(
      `SELECT 
        tp.id, tc.name as company_name, tpc.name as category_name, tp.amount
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = 13
       ORDER BY tp.id`
    );

    console.log('📦 All products with Arabic company names:');
    result.rows.forEach((p, i) => {
      console.log(`   [${i+1}] ${p.company_name} > ${p.category_name} > ${p.amount} IQD`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

fixCompanyNames();

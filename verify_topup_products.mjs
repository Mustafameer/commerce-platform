import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'commerce_db'
});

async function check() {
  try {
    // التحقق من منتجات topup في store 13
    const result = await pool.query(`
      SELECT 
        id, store_id, company_id, category_id, amount, price, retail_price, 
        wholesale_price, available_codes, is_active
      FROM topup_products 
      WHERE store_id = 13
    `);

    console.log('✅ Topup Products in Store 13:');
    result.rows.forEach(p => {
      console.log(`  - ID: ${p.id}, Amount: ${p.amount}, Price: ${p.price}, IsActive: ${p.is_active}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();

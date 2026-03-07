const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixCategoryName() {
  try {
    await pool.query(
      `UPDATE topup_product_categories 
       SET name = 'زين اثير - 50000'
       WHERE id = 22 AND store_id = 13`
    );

    console.log('✓ تم تحديث اسم الفئة');

    // Verify
    const result = await pool.query(`
      SELECT id, name FROM topup_product_categories 
      WHERE store_id = 13 
      ORDER BY id
    `);
    
    console.log('\n=== الفئات بعد التحديث ===');
    result.rows.forEach(r => {
      console.log(`ID ${r.id}: ${r.name}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixCategoryName();

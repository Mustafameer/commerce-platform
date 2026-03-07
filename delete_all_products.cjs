const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function deleteAllProducts() {
  try {
    // حذف جميع المنتجات
    const result = await pool.query(
      `DELETE FROM topup_products WHERE store_id = 13`,
      []
    );
    
    console.log(`✅ تم حذف ${result.rowCount} منتج(ات)`);

    // التحقق
    const check = await pool.query(`
      SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13
    `);
    
    console.log(`📦 المنتجات المتبقية: ${check.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

deleteAllProducts();

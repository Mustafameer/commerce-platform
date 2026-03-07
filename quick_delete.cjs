const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function deleteProduct(id) {
  try {
    const result = await pool.query(
      `UPDATE topup_products SET is_active = false WHERE id = $1 AND store_id = 13`,
      [parseInt(id)]
    );
    
    if (result.rowCount === 0) {
      console.log(`❌ المنتج ID ${id} غير موجود`);
      return;
    }
    
    console.log(`✅ تم حذف المنتج ID ${id}`);
    
    // عرض المنتجات المتبقية
    const remaining = await pool.query(`
      SELECT tp.id, tc.name as company, tpc.name as category, tp.amount
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13 AND tp.is_active = true
      ORDER BY tp.id
    `);
    
    console.log('\n📦 المنتجات المتبقية:');
    if (remaining.rows.length === 0) {
      console.log('لا توجد منتجات');
    } else {
      remaining.rows.forEach(p => {
        console.log(`ID: ${p.id} | ${p.company} | ${p.category}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

const productId = process.argv[2];
if (!productId) {
  console.log('❌ أرجو إدخال ID المنتج: node quick_delete.cjs <ID>');
  process.exit(1);
}

deleteProduct(productId);

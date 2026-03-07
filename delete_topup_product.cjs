const pg = require('pg');
const { Pool } = pg;
const readline = require('readline');

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function listProducts() {
  try {
    const result = await pool.query(`
      SELECT tp.id, tc.name as company, tpc.name as category, tp.amount, tp.price
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13 AND tp.is_active = true
      ORDER BY tp.id
    `);
    
    console.log('\n=== المنتجات الموجودة ===');
    result.rows.forEach(p => {
      console.log(`ID: ${p.id} | ${p.company} | ${p.category} | ${p.amount} دينار | ${p.price}`);
    });
    
    return result.rows;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function deleteProduct(id) {
  try {
    const result = await pool.query(
      `UPDATE topup_products SET is_active = false WHERE id = $1 AND store_id = 13`,
      [id]
    );
    
    if (result.rowCount === 0) {
      console.log('❌ المنتج غير موجود');
      return false;
    }
    
    console.log(`✅ تم حذف المنتج ID ${id}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
}

async function main() {
  await listProducts();
  
  rl.question('\n🗑️ أدخل ID المنتج المراد حذفه (أو "exit" للخروج): ', async (input) => {
    if (input === 'exit') {
      console.log('👋 تم الخروج');
      await pool.end();
      rl.close();
      return;
    }
    
    const productId = parseInt(input);
    if (isNaN(productId)) {
      console.log('❌ أدخل رقم صحيح');
      await pool.end();
      rl.close();
      return;
    }
    
    await deleteProduct(productId);
    await pool.end();
    rl.close();
  });
}

main();

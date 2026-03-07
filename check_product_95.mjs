import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkProduct95() {
  try {
    console.log('🔍 التحقق من منتج 95:\n');
    
    // Check in products table
    const productRes = await pool.query(`
      SELECT id, name, store_id FROM products WHERE id = 95
    `);
    
    console.log('✅ في جدول products:');
    console.table(productRes.rows);
    
    // Check in topup_products table
    const topupRes = await pool.query(`
      SELECT id, store_id, amount FROM topup_products WHERE store_id = 13 ORDER BY id DESC LIMIT 5
    `);
    
    console.log('\n✅ Topup Products في متجر 13:');
    console.table(topupRes.rows);
    
    // Check store 13 products
    const storeProductsRes = await pool.query(`
      SELECT id, name, store_id FROM products WHERE store_id = 13
    `);
    
    console.log('\n📦 جميع المنتجات العادية في متجر 13 (store ID):');
    console.table(storeProductsRes.rows);
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkProduct95();

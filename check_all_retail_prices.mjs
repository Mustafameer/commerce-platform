import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkAllProducts() {
  try {
    console.log('🔍 All Topup Products for Store 13\n');
    
    const productsRes = await dbPool.query(`
      SELECT id, amount, price, retail_price, wholesale_price, is_active
      FROM topup_products 
      WHERE store_id = 13
      ORDER BY id DESC
    `);
    
    console.log(`Total products: ${productsRes.rowCount}\n`);
    
    productsRes.rows.forEach(p => {
      const status = p.is_active ? '✅' : '❌';
      console.log(`${status} ID: ${p.id.toString().padStart(3)} | Amount: ${p.amount.toString().padStart(6)} | Price: ${p.price.toString().padStart(6)} | Retail: ${p.retail_price.toString().padStart(6)} | Wholesale: ${p.wholesale_price.toString().padStart(6)}`);
    });
    
    console.log('\n🔍 Products with zero retail_price:');
    const zeroProducts = productsRes.rows.filter(p => p.retail_price === 0);
    if (zeroProducts.length > 0) {
      zeroProducts.forEach(p => {
        console.log(`  - ID: ${p.id} (amount: ${p.amount})`);
      });
    } else {
      console.log('  None found ✅');
    }
    
    await dbPool.end();
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkAllProducts();

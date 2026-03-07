import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function fixPrices() {
  try {
    console.log('🔧 Fixing Topup Product Prices\n');
    console.log('Setting prices correctly:');
    console.log('  - retail_price (للجملة): same as current (37500 for high-value products, etc)');
    console.log('  - wholesale_price (للمفرد النقدي): use base price (40000 for high-value products, etc)\n');
    
    // Update products - set wholesale_price to match the base price
    const result = await dbPool.query(`
      UPDATE topup_products tp
      SET wholesale_price = tp.price
      WHERE store_id = 13;
    `);
    
    console.log(`✅ Updated ${result.rowCount} products`);
    
    // Verify
    console.log('\n📊 Updated Prices:');
    const verifyRes = await dbPool.query(`
      SELECT id, amount, price, retail_price, wholesale_price 
      FROM topup_products 
      WHERE store_id = 13 AND is_active = true
      ORDER BY id DESC
    `);
    
    verifyRes.rows.forEach(p => {
      console.log(`  ID ${p.id}: amount=${p.amount}, price=${p.price}, retail=${p.retail_price}, wholesale=${p.wholesale_price}`);
      console.log(`    → Reseller sees: ${p.retail_price}, Cash customer sees: ${p.wholesale_price}`);
    });
    
    await dbPool.end();
    console.log('\n✅ Prices fixed!');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixPrices();

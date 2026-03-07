import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function fixProductPrices() {
  try {
    console.log('🔧 Fixing Topup Product Prices\n');
    
    // Products that need fixing
    const updates = [
      { id: 93, retail: 37500, wholesale: 37500, reason: 'Has zero prices' },
      { id: 94, retail: 37500, wholesale: 37500, reason: 'Marked as inactive' }
    ];
    
    for (const {id, retail, wholesale, reason} of updates) {
      console.log(`📝 Updating Product ${id} (${reason})...`);
      
      const result = await dbPool.query(
        `UPDATE topup_products 
         SET retail_price = $1, wholesale_price = $2, is_active = true
         WHERE id = $3
         RETURNING id, amount, retail_price, wholesale_price, is_active`,
        [retail, wholesale, id]
      );
      
      if (result.rows.length > 0) {
        const p = result.rows[0];
        console.log(`   ✅ Updated: Retail=${p.retail_price}, Wholesale=${p.wholesale_price}, Active=${p.is_active}\n`);
      } else {
        console.log(`   ❌ Product not found\n`);
      }
    }
    
    // Verify all products now have correct prices
    console.log('📊 Verification - All Active Products:');
    const verifyRes = await dbPool.query(`
      SELECT id, amount, price, retail_price, wholesale_price 
      FROM topup_products 
      WHERE store_id = 13 AND is_active = true
      ORDER BY id DESC
    `);
    
    verifyRes.rows.forEach(p => {
      const status = p.retail_price > 0 ? '✅' : '⚠️';
      console.log(`${status} ID: ${p.id.toString().padStart(3)} | Retail: ${p.retail_price.toString().padStart(6)} | Wholesale: ${p.wholesale_price.toString().padStart(6)}`);
    });
    
    await dbPool.end();
    console.log('\n✅ All products fixed!');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixProductPrices();

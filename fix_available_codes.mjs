import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function fixMismatchedData() {
  try {
    console.log('🔧 Fixing topup_products codes mismatch...\n');
    
    const result = await pool.query(
      `SELECT id, available_codes, array_length(codes, 1) as codes_count
       FROM topup_products 
       WHERE store_id = 13 AND is_active = true
       ORDER BY id`
    );
    
    console.log('📋 Analyzing products:');
    console.log('─'.repeat(60));
    
    let fixedCount = 0;
    
    for (const product of result.rows) {
      const { id, available_codes, codes_count } = product;
      const actualCount = codes_count || 0;
      
      if (available_codes !== actualCount) {
        console.log(`\n🔴 Product ${id}:`);
        console.log(`   Before: available_codes = ${available_codes}, actual = ${actualCount}`);
        
        // Fix it
        await pool.query(
          `UPDATE topup_products SET available_codes = $1 WHERE id = $2`,
          [actualCount, id]
        );
        
        console.log(`   ✅ Fixed: available_codes = ${actualCount}`);
        fixedCount++;
      } else {
        console.log(`✅ Product ${id}: OK (${actualCount} codes)`);
      }
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log(`\n📊 Fixed ${fixedCount} products with mismatched data\n`);
    
    // Verify
    const verify = await pool.query(
      `SELECT 
        COUNT(*) as total_products,
        SUM(available_codes) as total_available,
        SUM(array_length(codes, 1)) as total_actual
       FROM topup_products 
       WHERE store_id = 13 AND is_active = true`
    );
    
    const { total_products, total_available, total_actual } = verify.rows[0];
    
    console.log('✨ Final Status:');
    console.log(`   Products: ${total_products}`);
    console.log(`   Total available_codes: ${total_available || 0}`);
    console.log(`   Total actual codes: ${total_actual || 0}`);
    console.log(`   Status: ${total_available === total_actual ? '✅ SYNCED' : '❌ STILL MISMATCHED'}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMismatchedData();

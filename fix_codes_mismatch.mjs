import pkg from 'pg';
const { Pool } = pkg;

// Use the same connection settings as server.ts
const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function fixCodesMismatch() {
  try {
    console.log('🔍 Checking topup_products for codes mismatch...\n');
    
    const result = await pool.query(
      `SELECT id, available_codes, codes, array_length(codes, 1) as codes_count
       FROM topup_products
       ORDER BY id`
    );
    
    let mismatchCount = 0;
    let fixedCount = 0;
    
    console.log('📊 Current Status:');
    console.log('─'.repeat(70));
    console.log(`ID  | Available | Actual | Status`);
    console.log('─'.repeat(70));
    
    for (const product of result.rows) {
      const { id, available_codes, codes, codes_count } = product;
      const actualCount = codes_count || (Array.isArray(codes) ? codes.length : 0);
      const isMismatch = available_codes !== actualCount;
      
      const status = isMismatch ? `❌ MISMATCH` : `✅ OK`;
      console.log(`${id.toString().padEnd(3)} | ${available_codes.toString().padEnd(9)} | ${actualCount.toString().padEnd(6)} | ${status}`);
      
      if (isMismatch) {
        mismatchCount++;
        
        // Fix by updating available_codes to match actual codes count
        await pool.query(
          `UPDATE topup_products SET available_codes = $1 WHERE id = $2`,
          [actualCount, id]
        );
        
        console.log(`    ↳ Fixed: available_codes updated from ${available_codes} to ${actualCount}`);
        fixedCount++;
      }
    }
    
    console.log('─'.repeat(70));
    console.log(`\n📈 Summary:`);
    console.log(`   - Total products: ${result.rows.length}`);
    console.log(`   - Mismatches found: ${mismatchCount}`);
    console.log(`   - Fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ All mismatches have been fixed!`);
    } else {
      console.log(`\n✅ No mismatches found - all codes are properly synchronized!`);
    }
    
    console.log('\n🔄 Final Verification:');
    console.log('─'.repeat(70));
    
    const verify = await pool.query(
      `SELECT id, available_codes, codes, array_length(codes, 1) as codes_count
       FROM topup_products
       ORDER BY id`
    );
    
    for (const product of verify.rows) {
      const { id, available_codes, codes_count } = product;
      const actualCount = codes_count || 0;
      const isCorrect = available_codes === actualCount;
      console.log(`ID ${id}: available_codes=${available_codes}, codes_count=${actualCount} ${isCorrect ? '✅' : '❌'}`);
    }
    
    console.log('─'.repeat(70));
    console.log('\n✨ Database integrity check complete!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCodesMismatch();

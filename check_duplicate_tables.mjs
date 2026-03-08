import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 All tables in database:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check for duplicates
    const tables = result.rows.map(r => r.table_name);
    const duplicates = tables.filter((item, index) => tables.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ DUPLICATES FOUND:');
      duplicates.forEach(dup => console.log(`  - ${dup}`));
    } else {
      console.log('\n✅ No duplicate tables');
    }
    
    // Count topup_products
    const topupProductsCount = tables.filter(t => t === 'topup_products').length;
    console.log(`\n📌 topup_products count: ${topupProductsCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();

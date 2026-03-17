import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function checkSchema() {
  try {
    console.log('\n📋 Checking product_images table...\n');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Table does not exist!');
    } else {
      console.log('✅ Columns in product_images:');
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    pool.end();
  }
}

checkSchema();

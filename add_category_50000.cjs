const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function addCategory50000() {
  try {
    console.log('📂 === ADDING CATEGORY 50000 ===\n');

    // Add category "امنية - 50000" 
    const result = await pool.query(
      'INSERT INTO topup_product_categories (store_id, name, is_active) VALUES ($1, $2, true) RETURNING id',
      [13, 'امنية - 50000']
    );

    console.log(`   ✅ Added category: امنية - 50000 (ID: ${result.rows[0].id})\n`);

    // Verify all categories
    console.log('📊 All Categories Now:\n');
    const cats = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    cats.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name}`);
    });

    console.log('\n✅ DONE!');

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addCategory50000();

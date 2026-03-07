const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixCompanyNames() {
  try {
    console.log('🔧 === FIXING COMPANY NAMES TO CORRECT ONES ===\n');

    const updates = [
      { id: 1, new_name: 'زين اثير' },
      { id: 2, new_name: 'آسيا سيل' },
      { id: 3, new_name: 'كورك' },
      { id: 4, new_name: 'امنية' }
    ];

    for (let comp of updates) {
      await pool.query(
        'UPDATE topup_companies SET name = $1 WHERE store_id = 13 AND id = $2',
        [comp.new_name, comp.id]
      );
      console.log(`   ✅ Company ${comp.id}: ${comp.new_name}`);
    }

    // Update category names to match
    console.log('\n📝 Updating category names to match new company names:\n');
    
    const categoryUpdates = [
      { id: 18, new_name: 'زين اثير - 5000' },
      { id: 19, new_name: 'آسيا سيل - 5000' },
      { id: 20, new_name: 'كورك - 5000' },
      { id: 21, new_name: 'امنية - 5000' }
    ];

    for (let cat of categoryUpdates) {
      await pool.query(
        'UPDATE topup_product_categories SET name = $1 WHERE id = $2',
        [cat.new_name, cat.id]
      );
      console.log(`   ✅ Category: ${cat.new_name}`);
    }

    console.log('\n✅ DONE!\n');
    console.log('📊 Verified data:\n');

    const companies = await pool.query(
      'SELECT id, name FROM topup_companies WHERE store_id = 13 ORDER BY id'
    );
    
    console.log('Companies:');
    companies.rows.forEach(c => {
      console.log(`   ${c.name}`);
    });

    const categories = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    console.log('\nCategories (Product Types):');
    categories.rows.forEach(c => {
      console.log(`   ${c.name}`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixCompanyNames();

const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkAllCompanies() {
  try {
    console.log('🔍 === ALL COMPANIES IN DATABASE ===\n');

    const res = await pool.query(
      'SELECT store_id, id, name FROM topup_companies ORDER BY store_id, id LIMIT 20'
    );

    console.log('All Companies:\n');
    res.rows.forEach(c => {
      console.log(`   Store ${c.store_id}, ID ${c.id}: ${c.name}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('\nCompanies for Store 13 specifically:');
    
    const store13 = await pool.query(
      'SELECT id, name FROM topup_companies WHERE store_id = 13 ORDER BY id'
    );
    
    store13.rows.forEach(c => {
      console.log(`   ID ${c.id}: ${c.name}`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAllCompanies();

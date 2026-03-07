const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkCompanies() {
  try {
    console.log('🔍 === ACTUAL COMPANY NAMES IN DATABASE ===\n');

    const res = await pool.query(
      'SELECT id, name FROM topup_companies WHERE store_id = 13 ORDER BY id'
    );

    console.log('Companies in Store 13:\n');
    res.rows.forEach(c => {
      console.log(`   ID ${c.id}: ${c.name}`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkCompanies();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function check() {
  try {
    const products = await pool.query('SELECT id, amount, price, images FROM topup_products WHERE store_id = 13');
    console.log('PRODUCTS WITH IMAGES:\n');
    products.rows.forEach((p, i) => {
      const imgCount = p.images && Array.isArray(p.images) ? p.images.length : 0;
      console.log(`[${i+1}] ID: ${p.id} | Amount: ${p.amount} | Images: ${imgCount}`);
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0];
        const preview = first?.substring ? first.substring(0, 80) : 'null';
        console.log(`    - First image: ${preview}...`);
      }
    });
    pool.end();
  } catch(e) { console.error('ERROR:', e.message); pool.end(); }
}

check();

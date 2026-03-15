const Pool = require('pg').Pool;
const pool = new Pool();

async function check() {
  try {
    const companies = await pool.query('SELECT id, store_id, name FROM topup_companies LIMIT 5');
    console.log('topup_companies count:', companies.rows.length);
    companies.rows.forEach(c => console.log('  - Store', c.store_id, ':', c.name));

    const products = await pool.query('SELECT id, store_id, company_id, amount, price FROM topup_products LIMIT 5');
    console.log('topup_products count:', products.rows.length);
    products.rows.forEach(p => console.log('  - Amount:', p.amount, 'Price:', p.price));

    const cats = await pool.query('SELECT id, store_id, name FROM topup_product_categories LIMIT 5');
    console.log('topup_product_categories count:', cats.rows.length);
    cats.rows.forEach(c => console.log('  - Store', c.store_id, ':', c.name));

    pool.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    pool.end();
  }
}

check();

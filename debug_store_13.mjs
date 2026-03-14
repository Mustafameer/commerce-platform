import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();

console.log('🔍 Checking Store 13 (Ali Al-Hadi):\n');

// Check store info
const storeInfo = await client.query('SELECT id, name, slug FROM stores WHERE id = 13');
console.log('📍 Store Info:', storeInfo.rows[0] || 'NOT FOUND');

// Check products in store 13
const products = await client.query(`
  SELECT id, store_id, amount, available_codes, company_id, company_name, is_active 
  FROM topup_products 
  WHERE store_id = 13
  ORDER BY id DESC
`);
console.log(`\n📦 Products in Store 13: ${products.rows.length}`);
if (products.rows.length > 0) {
  console.table(products.rows);
}

// Check companies in store 13
const companies = await client.query('SELECT id, store_id, name FROM topup_companies WHERE store_id = 13');
console.log(`\n🏢 Companies in Store 13: ${companies.rows.length}`);
if (companies.rows.length > 0) {
  console.table(companies.rows);
}

// Check categories in store 13
const categories = await client.query('SELECT id, store_id, name, is_active FROM topup_product_categories WHERE store_id = 13');
console.log(`\n📂 Categories in Store 13: ${categories.rows.length}`);
if (categories.rows.length > 0) {
  console.table(categories.rows);
}

await client.end();

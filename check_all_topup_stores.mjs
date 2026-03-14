import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();

// Check all topup stores
console.log('🏪 جميع المتاجر:\n');
const stores = await client.query(`
  SELECT id, name, slug FROM stores WHERE id IN (13, 21)
`);
console.log(stores.rows);

// Check products in both stores
console.log('\n📦 المنتجات في كل متجر:\n');
for (const store of stores.rows) {
  const products = await client.query(
    `SELECT id, store_id, amount, available_codes, company_name, is_active 
     FROM topup_products 
     WHERE store_id = $1 
     ORDER BY id DESC`,
    [store.id]
  );
  console.log(`\nمتجر ${store.id} (${store.name}):`);
  console.log(`عدد المنتجات: ${products.rows.length}`);
  if (products.rows.length > 0) {
    console.table(products.rows);
  }
}

await client.end();

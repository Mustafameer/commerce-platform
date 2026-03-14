import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

try {
  await client.connect();
  
  console.log('🔍 Checking ALL topup_products in database:\n');
  
  const allProducts = await client.query(`
    SELECT 
      id, store_id, company_id, amount, price, retail_price, wholesale_price,
      available_codes, is_active, company_name
    FROM topup_products
    ORDER BY store_id, id DESC
    LIMIT 20
  `);
  
  console.log(`Total products found: ${allProducts.rows.length}`);
  if (allProducts.rows.length > 0) {
    console.table(allProducts.rows);
  } else {
    console.log('❌ NO PRODUCTS FOUND IN DATABASE!');
  }
  
  // Check if table exists and structure
  console.log('\n📊 Table structure:');
  const tableInfo = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'topup_products'
    ORDER BY ordinal_position
  `);
  console.table(tableInfo.rows);
  
} catch (error) {
  console.error('Database error:', error);
} finally {
  await client.end();
}

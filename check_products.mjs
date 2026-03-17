import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function checkProducts() {
  try {
    console.log('\n📦 Available Products in Database\n');

    const result = await pool.query(`
      SELECT id, store_id, name, category_id 
      FROM products 
      WHERE store_id = 1 
      ORDER BY id
      LIMIT 5
    `);
    
    console.log(`Found ${result.rows.length} products:`);
    result.rows.forEach(p => {
      console.log(`  - ID: ${p.id}, Store: ${p.store_id}, Name: ${p.name}`);
    });

    if (result.rows.length === 0) {
      console.log('\n  No products found! Creating test data...');
      await pool.query(`
        INSERT INTO products (store_id, category_id, name, description, price, is_active)
        VALUES (1, 1, 'Sample Product', 'Test', 1000, true)
      `);
      console.log('  ✅ Created test product');
    }
    
    pool.end();
  }catch (e) {
    console.error('Error:', e.message);
    pool.end();
  }
}

checkProducts();

const pgp = require('pg-promise')();

const db = pgp({
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce',
  user: 'postgres',
  password: 'admin123'
});

async function check() {
  try {
    // Check product 95
    const product = await db.one('SELECT id, name, price, store_id, category_id FROM products WHERE id = 95');
    console.log('Product 95:', product);

    // Get store info
    if (product.store_id) {
      const store = await db.one('SELECT id, store_name FROM stores WHERE id = $1', [product.store_id]);
      console.log('Store:', store);
    }

    // Get full product with joins
    const fullProduct = await db.one(`
      SELECT products.id, products.name, products.price, 
             stores.store_name, categories.name as category_name
      FROM products 
      LEFT JOIN stores ON products.store_id = stores.id
      LEFT JOIN categories ON products.category_id = categories.id
      WHERE products.id = 95
    `);
    console.log('Full Product:', fullProduct);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();

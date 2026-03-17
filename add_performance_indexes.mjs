import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function addIndexes() {
  try {
    console.log('\n📈 Adding Performance Indexes...\n');

    const indexes = [
      // Foreign key indexes
      { name: 'idx_users_store_id', query: 'CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id)' },
      { name: 'idx_products_store_id', query: 'CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id)' },
      { name: 'idx_products_category_id', query: 'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)' },
      { name: 'idx_categories_store_id', query: 'CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id)' },
      { name: 'idx_customers_store_id', query: 'CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id)' },
      { name: 'idx_orders_customer_id', query: 'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)' },
      { name: 'idx_orders_store_id', query: 'CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id)' },
      
      // Topup specific
      { name: 'idx_topup_products_store_company', query: 'CREATE INDEX IF NOT EXISTS idx_topup_products_store_company ON topup_products(store_id, company_id)' },
      { name: 'idx_topup_product_images_product', query: 'CREATE INDEX IF NOT EXISTS idx_topup_product_images_product ON topup_product_images(topup_product_id)' },
      { name: 'idx_topup_companies_store', query: 'CREATE INDEX IF NOT EXISTS idx_topup_companies_store ON topup_companies(store_id)' },
      
      // Search indexes
      { name: 'idx_products_name', query: 'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)' },
      { name: 'idx_stores_name', query: 'CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(store_name)' },
      { name: 'idx_users_email', query: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
      { name: 'idx_customers_phone', query: 'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)' },
    ];

    for (const idx of indexes) {
      try {
        await pool.query(idx.query);
        console.log(`✅ ${idx.name}`);
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log(`⚠️  ${idx.name}: ${e.message.substring(0, 50)}`);
        } else {
          console.log(`✅ ${idx.name} (already exists)`);
        }
      }
    }

    console.log(`\n✅ Added ${indexes.length} indexes for better performance!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addIndexes();

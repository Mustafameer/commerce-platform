import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
const pool = new Pool({ connectionString, ssl: false });

async function completeRebuild() {
  try {
    console.log('\n=== بناء قاعدة البيانات الشاملة ===\n');

    // 1. حذف
    console.log('1. حذف الجداول القديمة...');
    await pool.query(`
      DROP TABLE IF EXISTS topup_product_images CASCADE;
      DROP TABLE IF EXISTS topup_orders_detail CASCADE;
      DROP TABLE IF EXISTS topup_orders CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS customer_payments CASCADE;
      DROP TABLE IF EXISTS customer_transactions CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS topup_products CASCADE;
      DROP TABLE IF EXISTS topup_product_categories CASCADE;
      DROP TABLE IF EXISTS topup_companies CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS merchant_applications CASCADE;
      DROP TABLE IF EXISTS app_settings CASCADE;
      DROP TABLE IF EXISTS company_users CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS auctions CASCADE;
      DROP TABLE IF EXISTS auction_bids CASCADE;
    `);
    console.log('   ✅ تم\n');

    // 2. الجداول
    console.log('2. إنشاء الجداول...');
    await pool.query(`
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        logo_url VARCHAR(500),
        primary_color VARCHAR(7),
        owner_id INTEGER,
        owner_name VARCHAR(255),
        owner_phone VARCHAR(20),
        percentage_enabled BOOLEAN DEFAULT false,
        commission_percentage DECIMAL(5,2) DEFAULT 0,
        subscription_paid BOOLEAN DEFAULT false,
        store_type VARCHAR(50),
        status VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        image_url VARCHAR(500),
        store_id INTEGER REFERENCES stores(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        price DECIMAL(10,2),
        retail_price DECIMAL(10,2),
        wholesale_price DECIMAL(10,2),
        category_id INTEGER REFERENCES categories(id),
        gallery TEXT[],
        stock_quantity INTEGER,
        is_auction BOOLEAN DEFAULT false,
        auction_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        topup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255),
        store_id INTEGER REFERENCES stores(id),
        can_access_admin BOOLEAN DEFAULT false,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name VARCHAR(255),
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255),
        current_debt DECIMAL(10,2) DEFAULT 0,
        starting_balance DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        topup_customer_id INTEGER,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        total_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2),
        phone VARCHAR(20),
        address TEXT,
        is_topup_order BOOLEAN DEFAULT false,
        customer_type VARCHAR(50),
        payment_status VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        topup_product_id INTEGER,
        quantity INTEGER,
        price DECIMAL(10,2),
        topup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name VARCHAR(255),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_product_categories (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        company_id INTEGER REFERENCES topup_companies(id),
        amount DECIMAL(15,2),
        price DECIMAL(10,2),
        retail_price DECIMAL(10,2),
        wholesale_price DECIMAL(10,2),
        images TEXT[],
        codes TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_product_images (
        id SERIAL PRIMARY KEY,
        topup_product_id INTEGER NOT NULL UNIQUE REFERENCES topup_products(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE customer_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        amount DECIMAL(10,2),
        type VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE app_settings (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        setting_key VARCHAR(255),
        setting_value TEXT,
        app_name VARCHAR(255),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        store_id INTEGER,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE topup_orders_detail (
        id SERIAL PRIMARY KEY,
        topup_order_id INTEGER REFERENCES topup_orders(id),
        product_id INTEGER,
        quantity INTEGER,
        price DECIMAL(10,2)
      );

      CREATE TABLE company_users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        user_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES topup_companies(id)
      );

      CREATE TABLE auctions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        product_id INTEGER REFERENCES products(id),
        starting_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE auction_bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id),
        customer_id INTEGER,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        bid_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE merchant_applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        store_name VARCHAR(255),
        category VARCHAR(255),
        store_type VARCHAR(50),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        rejection_reason TEXT
      );
    `);
    console.log('   ✅ تم\n');

    // 3. الفهارس
    console.log('3. إنشاء الفهارس...');
    await pool.query(`
      CREATE INDEX idx_topup_companies_store_id ON topup_companies(store_id);
      CREATE INDEX idx_topup_products_store_id ON topup_products(store_id);
      CREATE INDEX idx_topup_product_images_product_id ON topup_product_images(topup_product_id);
    `);
    console.log('   ✅ تم\n');

    // 4. البيانات
    console.log('4. إضافة البيانات...');
    
    // Store 13
    await pool.query(`
      INSERT INTO stores (id, store_name, slug, owner_name, owner_phone, is_active, store_type, status)
      VALUES (13, 'علي الهادي', 'ali-hadi', 'علي الهادي', '967777777777', true, 'topup', 'active')
    `);

    // Companies
    const comp = await pool.query(`
      INSERT INTO topup_companies (store_id, name, logo_url)
      VALUES 
        (13, 'زين اثير', 'https://via.placeholder.com/100'),
        (13, 'آسيا سيل', 'https://via.placeholder.com/100'),
        (13, 'كورك', 'https://via.placeholder.com/100')
      RETURNING id
    `);
    const compIds = comp.rows.map(r => r.id);

    // Products
    const prod = await pool.query(`
      INSERT INTO topup_products (store_id, company_id, amount, price, retail_price, wholesale_price, is_active)
      VALUES 
        (13, $1, 35000, 40000, 38000, 37000, true),
        (13, $2, 25000, 27500, 26500, 26000, true),
        (13, $3, 15000, 17500, 16500, 16000, true)
      RETURNING id
    `, [compIds[0], compIds[1], compIds[2]]);
    const prodIds = prod.rows.map(r => r.id);

    // Images
    const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+';
    const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+';
    const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MTV8AzwvdGV4dD48L3N2Zz4=';
    const svgs = [svg1, svg2, svg3];

    for (let i = 0; i < prodIds.length; i++) {
      await pool.query(`
        INSERT INTO topup_product_images (topup_product_id, image_data, image_type)
        VALUES ($1, $2, 'svg')
      `, [prodIds[i], svgs[i]]);
    }
    console.log('   ✅ تم\n');

    // 5. التحقق
    const stores = await pool.query('SELECT COUNT(*) as count FROM stores');
    const companies = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = 13');
    const products = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13');
    const images = await pool.query('SELECT COUNT(*) as count FROM topup_product_images');

    console.log('✅ النتائج:');
    console.log(`   📊 المتاجر: ${stores.rows[0].count}`);
    console.log(`   🏢 الشركات: ${companies.rows[0].count}`);
    console.log(`   📦 المنتجات: ${products.rows[0].count}`);
    console.log(`   🖼️  الصور: ${images.rows[0].count}\n`);

    console.log('✅ جاهز! ابدأ السرفر بـ: npm run dev\n');
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    await pool.end();
  }
}

completeRebuild();

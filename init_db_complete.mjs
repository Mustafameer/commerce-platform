import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 جاري إنشاء جداول قاعدة البيانات...\n');

    // Create all tables with IF NOT EXISTS
    await client.query(`
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255),
        can_access_admin BOOLEAN DEFAULT false,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create stores table
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        logo_url VARCHAR(500),
        primary_color VARCHAR(7),
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        image_url VARCHAR(500),
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        price DECIMAL(10,2),
        retail_price DECIMAL(10,2),
        wholesale_price DECIMAL(10,2),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        gallery TEXT[],
        stock_quantity INTEGER,
        is_auction BOOLEAN DEFAULT false,
        auction_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        topup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255),
        current_debt DECIMAL(10,2) DEFAULT 0,
        starting_balance DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        topup_customer_id INTEGER,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
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

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        topup_product_id INTEGER,
        quantity INTEGER,
        price DECIMAL(10,2),
        topup_codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_companies table
      CREATE TABLE IF NOT EXISTS topup_companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_product_categories table
      CREATE TABLE IF NOT EXISTS topup_product_categories (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_products table
      CREATE TABLE IF NOT EXISTS topup_products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES topup_companies(id) ON DELETE SET NULL,
        amount DECIMAL(15,2),
        price DECIMAL(10,2),
        retail_price DECIMAL(10,2),
        wholesale_price DECIMAL(10,2),
        images TEXT[],
        codes TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_product_images table
      CREATE TABLE IF NOT EXISTS topup_product_images (
        id SERIAL PRIMARY KEY,
        topup_product_id INTEGER NOT NULL UNIQUE REFERENCES topup_products(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create cart_items table
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create customer_payments table
      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create customer_transactions table
      CREATE TABLE IF NOT EXISTS customer_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        transaction_type VARCHAR(50),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_orders table
      CREATE TABLE IF NOT EXISTS topup_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        total_amount DECIMAL(10,2),
        status VARCHAR(50),
        is_topup_order BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create topup_orders_detail table
      CREATE TABLE IF NOT EXISTS topup_orders_detail (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES topup_orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
        quantity INTEGER,
        price DECIMAL(10,2),
        codes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create merchant_applications table
      CREATE TABLE IF NOT EXISTS merchant_applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        store_name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        store_type VARCHAR(50),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rejection_reason TEXT
      );

      -- Create app_settings table
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        store_id INTEGER UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
        app_name TEXT,
        logo_url TEXT,
        admin_commission_percentage DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create company_users table
      CREATE TABLE IF NOT EXISTS company_users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        can_access_admin BOOLEAN DEFAULT false,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create auctions table
      CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        title VARCHAR(255),
        description TEXT,
        starting_price DECIMAL(10,2),
        current_price DECIMAL(10,2),
        highest_bidder_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        status VARCHAR(50),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create auction_bids table
      CREATE TABLE IF NOT EXISTS auction_bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
        bidder_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        bid_amount DECIMAL(10,2),
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ جميع الجداول تم إنشاؤها بنجاح!\n');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
      CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
      CREATE INDEX IF NOT EXISTS idx_topup_products_store ON topup_products(store_id);
      CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product ON topup_product_images(topup_product_id);
      CREATE INDEX IF NOT EXISTS idx_orders_topup_customer_id ON orders(topup_customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id_topup ON orders(customer_id);
    `);

    console.log('✅ جميع الفهارس تم إنشاؤها بنجاح!\n');

    // List created tables
    const result = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    console.log('📋 الجداول المتوفرة:');
    console.log('=' .repeat(50));
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.tablename}`);
    });
    console.log('=' .repeat(50));
    console.log(`\n✅ إجمالي الجداول: ${result.rows.length}\n`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

initializeDatabase();

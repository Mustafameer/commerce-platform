import express from "express";
import cors from "cors";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeDatabase } from "./db-init.ts";

// Fix: Ensure all admin endpoints use proper ID validation
console.log("📡 [SERVER] Server module loading...");

dotenv.config();

console.log("📡 [SERVER] Dotenv loaded");

// Log environment variables
console.log("📋 Environment Variables:");
console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "❌ Not set");
console.log("  PORT:", process.env.PORT || "3000 (default)");
console.log("  NODE_ENV:", process.env.NODE_ENV || "development (default)");

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);

console.log("📡 [SERVER] ESM utilities loaded");

// Helper function to slugify store names (handles Arabic characters)
function createSlug(text: string): string {
  // Remove Arabic and special characters, keep only alphanumeric
  const slug = text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // Keep Arabic Unicode ranges and ASCII
    .replace(/[\u0600-\u06FF]+/g, 'store') // Replace Arabic chars with 'store'
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  
  return slug || `store-${Date.now()}`;
}
const __dirname = path.dirname(__filename);

console.log("📡 [SERVER] Creating database pool...");

// Build connection string from various sources
let connectionString = process.env.DATABASE_URL;

// If DATABASE_URL not set, try Railway hardcoded connection (production)
if (!connectionString || !connectionString.includes("@")) {
  connectionString = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';
  console.log("ℹ️  [SERVER] Using Railway hardcoded connection");
}

// Fallback to localhost if not Railway (development only)
if (!connectionString.includes('postgres.railway.internal') && !connectionString.includes('localhost')) {
  const pgHost = process.env.PGHOST || process.env.DB_HOST || "localhost";
  const pgPort = process.env.PGPORT || process.env.DB_PORT || "5432";
  const pgUser = process.env.PGUSER || process.env.DB_USER || "postgres";
  const pgPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD || "123";
  const pgDatabase = process.env.PGDATABASE || process.env.DB_NAME || "multi_ecommerce";
  
  if (pgPassword) {
    connectionString = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
  } else {
    connectionString = `postgresql://${pgUser}@${pgHost}:${pgPort}/${pgDatabase}`;
  }
  
  console.log("ℹ️  [SERVER] Using environment variables");
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

console.log("✅ [SERVER] Database pool created");
console.log("🔌 Database connection string:", connectionString.substring(0, 50) + "...");

async function testConnection() {
  try {
    console.log("🔄 Testing database connection...");
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce";
    console.log("🔌 Using DATABASE_URL:", dbUrl.substring(0, 50) + "...");
    
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful!");
    console.log("Current time from DB:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function initDb() {
  try {
    console.log("📋 Creating tables...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        password TEXT,
        role TEXT CHECK(role IN ('admin', 'merchant', 'customer')),
        is_active BOOLEAN DEFAULT TRUE,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        store_name TEXT,
        slug TEXT UNIQUE,
        description TEXT,
        logo_url TEXT,
        status TEXT DEFAULT 'pending',
        owner_name TEXT,
        owner_email TEXT,
        owner_phone TEXT,
        category TEXT,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT FALSE,
        percentage_enabled BOOLEAN DEFAULT TRUE,
        subscription_paid BOOLEAN DEFAULT FALSE,
        commission_percentage DECIMAL(5, 2) DEFAULT 0,
        primary_color TEXT DEFAULT '#4F46E5'
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        category_id INTEGER,
        name TEXT,
        description TEXT,
        price DECIMAL(10, 2),
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        gallery JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        topup_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        total_amount DECIMAL(10, 2),
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        is_topup_order BOOLEAN DEFAULT FALSE,
        topup_codes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER,
        price DECIMAL(10, 2)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        customer_type VARCHAR(50) DEFAULT 'cash',
        credit_limit DECIMAL(10, 2) DEFAULT 0,
        current_debt DECIMAL(10, 2) DEFAULT 0,
        starting_balance DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, phone)
      );

      CREATE TABLE IF NOT EXISTS customer_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        transaction_type VARCHAR(50),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        store_id INTEGER UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
        app_name TEXT,
        logo_url TEXT,
        admin_commission_percentage DECIMAL(5, 2) DEFAULT 0,
        primary_color TEXT DEFAULT '#4F46E5',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS topup_companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS topup_product_categories (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS topup_products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES topup_companies(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES topup_product_categories(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        price INTEGER NOT NULL,
        retail_price INTEGER DEFAULT 0,
        wholesale_price INTEGER DEFAULT 0,
        available_codes INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        auction_date DATE NOT NULL,
        auction_start_time TIME NOT NULL,
        auction_end_time TIME NOT NULL,
        starting_price DECIMAL(10, 2) NOT NULL,
        current_highest_price DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        final_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS auction_bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bid_price DECIMAL(10, 2) NOT NULL,
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("✅ Tables created successfully!");
    
    // Run migrations for existing databases
    console.log("🔄 Running migrations...");
    await runMigrations();
    console.log("✅ Migrations completed!");
    
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    return false;
  }
}

async function runMigrations() {
  try {
    // Add primary_color column to app_settings if it doesn't exist
    await pool.query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4F46E5';
    `);
    console.log("✅ Migration: primary_color column ensured in app_settings");
    
    // Add commission_percentage column to stores if it doesn't exist
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 0;
    `);
    console.log("✅ Migration: commission_percentage column ensured in stores");
    
    // Add primary_color column to stores if it doesn't exist
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4F46E5';
    `);
    console.log("✅ Migration: primary_color column ensured in stores");
    
    // Add percentage_enabled column to stores if it doesn't exist
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS percentage_enabled BOOLEAN DEFAULT TRUE;
    `);
    console.log("✅ Migration: percentage_enabled column ensured in stores");
    
    // Add subscription_paid column to stores if it doesn't exist
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS subscription_paid BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ Migration: subscription_paid column ensured in stores");

    // Add store_type column to stores if it doesn't exist
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS store_type VARCHAR(50) DEFAULT 'regular';
    `);
    console.log("✅ Migration: store_type column ensured in stores");

    // Update owner_name and owner_phone from users table for existing stores
    await pool.query(`
      UPDATE stores s
      SET 
        owner_name = COALESCE(s.owner_name, u.name),
        owner_phone = COALESCE(s.owner_phone, u.phone)
      FROM users u
      WHERE s.owner_id = u.id
      AND (s.owner_name IS NULL OR s.owner_name = '' OR s.owner_phone IS NULL OR s.owner_phone = '')
    `);
    console.log("✅ Migration: Updated missing owner_name and owner_phone from users table");

    // Ensure percentage_enabled and commission_percentage have defaults
    await pool.query(`
      UPDATE stores
      SET 
        percentage_enabled = true,
        commission_percentage = CASE 
          WHEN commission_percentage IS NULL OR commission_percentage = 0 THEN 10
          ELSE commission_percentage
        END
    `);
    console.log("✅ Migration: Set default percentage_enabled and commission_percentage");

    // Fix orders foreign key to support cascading delete
    try {
      await pool.query(`
        ALTER TABLE orders
        DROP CONSTRAINT IF EXISTS orders_store_id_fkey
      `);
      console.log("✅ Migration: Dropped old orders_store_id_fkey constraint");
      
      await pool.query(`
        ALTER TABLE orders
        ADD CONSTRAINT orders_store_id_fkey 
        FOREIGN KEY (store_id) 
        REFERENCES stores(id) 
        ON DELETE CASCADE
      `);
      console.log("✅ Migration: Added new orders_store_id_fkey constraint with ON DELETE CASCADE");
    } catch (error) {
      const msg = (error as any).message || '';
      if (!msg.includes('already exists')) {
        console.log("ℹ️  Foreign key migration info:", msg);
      }
    }

    // Add gallery column to products if it doesn't exist
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
    `);
    console.log("✅ Migration: gallery column ensured in products");

    // Add store_id column to users if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL;
    `);
    console.log("✅ Migration: store_id column added to users");

    // Link users to their stores (for existing merchants without store_id)
    await pool.query(`
      UPDATE users
      SET store_id = (
        SELECT id FROM stores 
        WHERE stores.owner_id = users.id 
        LIMIT 1
      )
      WHERE users.role = 'merchant' 
      AND users.store_id IS NULL
      AND EXISTS (
        SELECT 1 FROM stores 
        WHERE stores.owner_id = users.id
      )
    `);
    console.log("✅ Migration: Linked existing merchants to their stores");

    // Add topup_codes column to order_items if it doesn't exist
    await pool.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS topup_codes TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log("✅ Migration: topup_codes column added to order_items");

    // Add topup_product_id column to order_items if it doesn't exist
    await pool.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS topup_product_id INTEGER REFERENCES topup_products(id);
    `);
    console.log("✅ Migration: topup_product_id column added to order_items");

    // Make product_id nullable for topup orders
    try {
      await pool.query(`
        ALTER TABLE order_items
        ALTER COLUMN product_id DROP NOT NULL;
      `);
      console.log("✅ Migration: product_id column made nullable in order_items");
    } catch (error) {
      const msg = (error as any).message || '';
      if (!msg.includes('does not exist')) {
        console.log("ℹ️  product_id nullable migration info:", msg);
      }
    }

    // Drop foreign key constraint on product_id to allow NULL values without constraint violation
    try {
      await pool.query(`
        ALTER TABLE order_items
        DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
      `);
      console.log("✅ Migration: order_items_product_id_fkey constraint dropped");
    } catch (error) {
      const msg = (error as any).message || '';
      console.log("ℹ️  FK constraint drop info:", msg);
    }

    // Make address column nullable for topup orders
    await pool.query(`
      ALTER TABLE orders
      ALTER COLUMN address DROP NOT NULL;
    `);
    console.log("✅ Migration: address column made nullable in orders");

    // Add retail_price and wholesale_price columns for topup products
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS retail_price INTEGER DEFAULT 0;
    `);
    console.log("✅ Migration: retail_price column added to products");

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS wholesale_price INTEGER DEFAULT 0;
    `);
    console.log("✅ Migration: wholesale_price column added to products");

    // Add topup customer columns to orders for credit system
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);
    `);
    console.log("✅ Migration: customer_type column added to orders");

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'paid';
    `);
    console.log("✅ Migration: payment_status column added to orders");

    // Add password column to customers table for authentication
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
    console.log("✅ Migration: password column added to customers");

    // Add starting_balance column to customers table
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS starting_balance DECIMAL(10, 2) DEFAULT 0;
    `);
    console.log("✅ Migration: starting_balance column added to customers");

    // Add codes column to topup_products table
    await pool.query(`
      ALTER TABLE topup_products
      ADD COLUMN IF NOT EXISTS codes TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log("✅ Migration: codes column added to topup_products");

    // Add images column to topup_products table
    await pool.query(`
      ALTER TABLE topup_products
      ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log("✅ Migration: images column added to topup_products");

    // Add is_active column to topup_products table
    await pool.query(`
      ALTER TABLE topup_products
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);
    console.log("✅ Migration: is_active column added to topup_products");

    // Add auction columns to products table
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_auction BOOLEAN DEFAULT FALSE;
    `);
    console.log("✅ Migration: is_auction column added to products");

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS auction_id INTEGER REFERENCES auctions(id) ON DELETE SET NULL;
    `);
    console.log("✅ Migration: auction_id column added to products");

    // Add customer_name and customer_phone to auction_bids for contact information
    await pool.query(`
      ALTER TABLE auction_bids
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
    `);
    console.log("✅ Migration: customer_name column added to auction_bids");

    await pool.query(`
      ALTER TABLE auction_bids
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
    `);
    console.log("✅ Migration: customer_phone column added to auction_bids");

    // Make customer_id nullable to allow anonymous bids
    await pool.query(`
      ALTER TABLE auction_bids
      ALTER COLUMN customer_id DROP NOT NULL;
    `);
    console.log("✅ Migration: customer_id made nullable for anonymous bids");

    // Drop the foreign key constraint if it exists and recreate it as nullable
    await pool.query(`
      ALTER TABLE auction_bids
      DROP CONSTRAINT IF EXISTS auction_bids_customer_id_fkey,
      ADD CONSTRAINT auction_bids_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log("✅ Migration: customer_id foreign key constraint updated");

    // Add can_access_admin column to users if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS can_access_admin BOOLEAN DEFAULT false;
    `);
    console.log("✅ Migration: can_access_admin column added to users");

    // Set admin users to have can_access_admin = true
    await pool.query(`
      UPDATE users SET can_access_admin = true WHERE role = 'admin' AND can_access_admin = false;
    `);
    console.log("✅ Migration: Admin users updated with can_access_admin = true");

    // Add topup_customer_id column to orders for topup store customers (credit system)
    try {
      await pool.query(`
        ALTER TABLE orders
        ADD COLUMN topup_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
      `);
      console.log("✅ Migration: topup_customer_id column added to orders table");
    } catch (e) {
      // Column already exists, ignore
    }

    // Add is_active column to stores table for soft delete support
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);
    console.log("✅ Migration: is_active column added to stores");

    // Create indexes for performance optimization
    console.log("📊 Creating database indexes for better query performance...");
    
    // Index for topup_companies queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_companies_store_id 
      ON topup_companies(store_id);
    `);
    console.log("✅ Index: idx_topup_companies_store_id created");
    
    // Index for topup_product_categories queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_product_categories_store_id 
      ON topup_product_categories(store_id);
    `);
    console.log("✅ Index: idx_topup_product_categories_store_id created");
    
    // Index for topup_products queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_products_store_id 
      ON topup_products(store_id);
    `);
    console.log("✅ Index: idx_topup_products_store_id created");
    
    // Index for topup_products company lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_topup_products_company_id 
      ON topup_products(company_id);
    `);
    console.log("✅ Index: idx_topup_products_company_id created");

  } catch (error) {
    // Ignore column already exists errors
    const errorMsg = (error as any).message || '';
    if (!errorMsg.includes('already exists') && !errorMsg.includes('already exists as')) {
      console.error("⚠️  Migration warning:", error);
    }
  }
}

async function seedData() {
  try {
    // Check if admin user already exists
    const adminCheck = await pool.query("SELECT id FROM users WHERE role = $1 LIMIT 1", ['admin']);
    
    if (adminCheck.rows.length === 0) {
      // Create admin user
      await pool.query(
        "INSERT INTO users (name, phone, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
        ['Admin', 'admin', 'admin@commerce.local', 'password', 'admin', true]
      );
      console.log("✅ Admin user created: phone: admin, password: password");
    }

    // Check if sample merchants exist
    const merchantCheck = await pool.query("SELECT id FROM users WHERE role = $1", ['merchant']);
    
    if (merchantCheck.rows.length === 0) {
      // Create sample merchant 1 (محمد)
      const user1 = await pool.query(
        "INSERT INTO users (name, phone, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        ['محمد أحمد', '0771234567', 'merchant1@commerce.local', 'password', 'merchant', true]
      );

      // Create store for user1
      await pool.query(
        "INSERT INTO stores (owner_id, store_name, owner_name, owner_phone, slug, logo_url, commission_percentage, primary_color, status, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [user1.rows[0].id, 'متجر محمد', 'محمد أحمد', '0771234567', 'mohamad-store', 'https://via.placeholder.com/150?text=محمد', 10, '#4F46E5', 'active', true]
      );

      // Create sample merchant 2
      const user2 = await pool.query(
        "INSERT INTO users (name, phone, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        ['علي محسن', '0781234567', 'merchant2@commerce.local', 'password', 'merchant', true]
      );

      // Create store for user2
      await pool.query(
        "INSERT INTO stores (owner_id, store_name, owner_name, owner_phone, slug, logo_url, commission_percentage, primary_color, status, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [user2.rows[0].id, 'متجر علي', 'علي محسن', '0781234567', 'ali-store', 'https://via.placeholder.com/150?text=علي', 10, '#EC4899', 'active', true]
      );

      console.log("✅ Sample merchants created");
      console.log("  - Merchant 1: phone: 0771234567, password: password");
      console.log("  - Merchant 2: phone: 0781234567, password: password");
    }

    // Check if app settings exist
    const settingsCheck = await pool.query("SELECT id FROM app_settings LIMIT 1");
    
    if (settingsCheck.rows.length === 0) {
      // Create default app settings
      await pool.query(
        "INSERT INTO app_settings (app_name, logo_url, primary_color, admin_commission_percentage) VALUES ($1, $2, $3, $4)",
        ['منصتي - المتاجر الذكية', 'https://via.placeholder.com/150?text=منصتي', '#4F46E5', 5]
      );
      console.log("✅ Default app settings created");
    }

    // Create sample orders for testing commission calculation
    const ordersCheck = await pool.query("SELECT COUNT(*) as count FROM orders");
    if (parseInt(ordersCheck.rows[0].count) === 0) {
      // Get a customer (create if needed)
      let customerId = 1;
      const customerCheck = await pool.query("SELECT id FROM users WHERE role = $1 LIMIT 1", ['customer']);
      if (customerCheck.rows.length === 0) {
        const customerResult = await pool.query(
          "INSERT INTO users (name, phone, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          ['Customer', 'customer', 'customer@commerce.local', 'password', 'customer', true]
        );
        customerId = customerResult.rows[0].id;
      } else {
        customerId = customerCheck.rows[0].id;
      }

      // Get store IDs
      const storesResult = await pool.query("SELECT id FROM stores LIMIT 2");
      if (storesResult.rows.length > 0) {
        // Create sample orders
        for (let i = 0; i < storesResult.rows.length; i++) {
          const storeId = storesResult.rows[i].id;
          const totalAmount = 500000 * (i + 1); // 500k, 1M, etc.
          
          const orderResult = await pool.query(
            "INSERT INTO orders (customer_id, store_id, total_amount, discount_amount, phone, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [customerId, storeId, totalAmount, 0, '0799999999', 'Baghdad - Test Address', 'completed']
          );
          
          console.log(`✅ Sample order created: Store ${storeId}, Amount: ${totalAmount}`);
        }
      }
    }

    // Seed default topup companies and categories for topup stores
    // ❌ DISABLED: Don't recreate companies, users manage them via API
    /*
    const topupStoresResult = await pool.query(
      "SELECT id FROM stores WHERE store_type = 'topup' ORDER BY id ASC"
    );

    const defaultCompanies = [
      { name: "Zain", logo_url: "https://via.placeholder.com/100?text=Zain" },
      { name: "Asiacell", logo_url: "https://via.placeholder.com/100?text=Asiacell" },
      { name: "Ooredoo", logo_url: "https://via.placeholder.com/100?text=Ooredoo" },
      { name: "HaloTel", logo_url: "https://via.placeholder.com/100?text=HaloTel" }
    ];

    for (const store of topupStoresResult.rows) {
      const storeId = store.id;
      
      // Check if this store already has companies
      const companiesCheck = await pool.query(
        "SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1",
        [storeId]
      );

      if (parseInt(companiesCheck.rows[0].count) === 0) {
        // Insert default companies
        for (const company of defaultCompanies) {
          await pool.query(
            `INSERT INTO topup_companies (store_id, name, logo_url) VALUES ($1, $2, $3)`,
            [storeId, company.name, company.logo_url]
          );
        }
        console.log(`✅ Seeded ${defaultCompanies.length} companies for topup store ${storeId}`);
      }
    }
    */

  } catch (error) {
    const errorMsg = (error as any).message || '';
    // Ignore duplicate key errors (data already exists)
    if (!errorMsg.includes('duplicate key') && !errorMsg.includes('violates unique constraint')) {
      console.warn("⚠️  Seed data warning:", error);
    }
  }
}

async function startServer() {
  try {
    // Test database connection first
    const connected = await testConnection();
    if (!connected) {
      console.warn("⚠️  Database connection failed, but starting server anyway (check database settings)");
    } else {
      // Load/restore data from backup if database is empty
      const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce";
      await initializeDatabase(dbUrl);
      
      // Only initialize DB if connected
      await initDb();
      
      // Seed default data
      await seedData();
    }
    
    const app = express();
    
    // Configure CORS for production & development
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://commerce-platform-six.vercel.app', // Vercel frontend production
      'https://web-production-9efff.up.railway.app', // Rail way backend (self)
    ];
    
    // Add dynamic Vercel and Railway URLs when available as environment variables
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    
    app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // Increase JSON body size limit to allow base64 images (logos) in settings
    app.use(express.json({ limit: "10mb" }));
    
    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });
    
    // Test database endpoint
    app.get("/api/test-db", async (req, res) => {
      try {
        console.log("🧪 Testing database...");
        
        const storesCount = await pool.query("SELECT COUNT(*) as count FROM stores");
        const ordersCount = await pool.query("SELECT COUNT(*) as count FROM orders");
        const usersCount = await pool.query("SELECT COUNT(*) as count FROM users");
        const ordersData = await pool.query("SELECT id, store_id, total_amount, created_at FROM orders LIMIT 5");
        const storesData = await pool.query("SELECT id, store_name, owner_name, percentage_enabled, commission_percentage FROM stores LIMIT 5");
        
        const result = {
          status: "ok", 
          stores_count: parseInt(storesCount.rows[0].count),
          orders_count: parseInt(ordersCount.rows[0].count),
          users_count: parseInt(usersCount.rows[0].count),
          orders_sample: ordersData.rows,
          stores_sample: storesData.rows
        };
        
        console.log("✅ Database test successful:", result);
        res.json(result);
      } catch (error) {
        const errorMessage = (error as any).message || 'Unknown error';
        console.error("❌ Database test error:", errorMessage);
        console.error("Full error:", error);
        
        res.status(500).json({ 
          status: "error", 
          message: errorMessage,
          error: (error as any).code || 'UNKNOWN'
        });
      }
    });

    // Reset seed data endpoint
    app.post("/api/reset-seed", async (req, res) => {
      try {
        console.log("🔄 Resetting seed data...");
        await seedData();
        res.json({ success: true, message: "Seed data reset successfully" });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // Get stores
    app.get("/api/stores", async (req, res) => {
      try {
        const { limit = 50, offset = 0 } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 50, 500);
        const offsetNum = Math.max(0, parseInt(offset as string) || 0);
        
        const result = await pool.query(`
          SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone
          FROM stores
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum]);
        
        res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get single store by ID
    app.get("/api/stores/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        const result = await pool.query(`
          SELECT s.*, u.name as owner_name_from_user, u.phone as owner_phone_from_user
          FROM stores s
          LEFT JOIN users u ON s.owner_id = u.id
          WHERE s.id = $1
        `, [storeId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Store not found' });
        }
        
        const store = result.rows[0];
        res.json({
          ...store,
          owner_name: store.owner_name || store.owner_name_from_user || 'غير معروف',
          owner_phone: store.owner_phone || store.owner_phone_from_user || ''
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get store by slug (new endpoint for friendly URLs)
    app.get("/api/stores/slug/:slug", async (req, res) => {
      try {
        const { slug } = req.params;
        const startTime = Date.now();
        console.log(`📍 [STORE API] Request for slug: "${slug}" at ${startTime}`);
        
        // Cache for 5 minutes to reduce database load
        res.set('Cache-Control', 'private, max-age=300');
        
        // Check if slug is numeric (ID)
        const isNumericId = /^\d+$/.test(slug);
        
        let result;
        if (isNumericId) {
          // Search by ID - extremely simple and fast
          console.log(`  ⏱️  Querying by ID: ${parseInt(slug)}`);
          result = await pool.query(`SELECT * FROM stores WHERE id = $1 LIMIT 1`, [parseInt(slug)]);
        } else {
          // Search by slug - use index efficiently
          console.log(`  ⏱️  Querying by slug: "${slug}"`);
          result = await pool.query(`SELECT * FROM stores WHERE slug = $1 LIMIT 1`, [slug]);
        }
        
        const queryTime = Date.now() - startTime;
        console.log(`  ✅ Query completed in ${queryTime}ms, rows: ${result.rows.length}`);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Store not found' });
        }
        
        const store = result.rows[0];
        const totalTime = Date.now() - startTime;
        console.log(`  ✅ Total time: ${totalTime}ms`);
        res.json(store);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // Create store
    app.post("/api/stores", async (req, res) => {
      try {
        const { store_name, owner_name, owner_phone, password } = req.body;
        
        // Validate required fields
        if (!store_name || !owner_name || !owner_phone) {
          return res.status(400).json({ error: 'اسم المتجر واسم المالك ورقم الهاتف مطلوبة' });
        }
        
        // 1. Check if user exists with this phone
        let userId;
        const userCheck = await pool.query("SELECT id FROM users WHERE phone = $1", [owner_phone]);
        
        if (userCheck.rows.length > 0) {
          userId = userCheck.rows[0].id;
          // Update user name if different
          await pool.query(
            "UPDATE users SET name = $1, role = $2 WHERE id = $3",
            [owner_name, 'merchant', userId]
          );
        } else {
          // 2. Create new user if doesn't exist
          const userResult = await pool.query(
            "INSERT INTO users (name, phone, password, role, email) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [owner_name, owner_phone, password || 'password123', 'merchant', null]
          );
          userId = userResult.rows[0].id;
        }
        
        // 3. Create store slug
        let storeSlug = createSlug(store_name);
        
        // Check if slug already exists and make it unique
        const slugCheck = await pool.query("SELECT id FROM stores WHERE slug = $1", [storeSlug]);
        if (slugCheck.rows.length > 0) {
          storeSlug = `${storeSlug}-${Date.now()}`;
        }
        
        // 4. Create store with owner_id (pending approval)
        const result = await pool.query(
          "INSERT INTO stores (owner_id, store_name, owner_name, owner_phone, slug, is_active, status) VALUES ($1, $2, $3, $4, $5, false, 'pending') RETURNING *",
          [userId, store_name, owner_name, owner_phone, storeSlug]
        );
        
        const storeId = result.rows[0].id;
        
        // 5. Link user to store
        await pool.query(
          "UPDATE users SET store_id = $1 WHERE id = $2",
          [storeId, userId]
        );
        
        res.json({
          store: result.rows[0],
          user: { id: userId, name: owner_name, phone: owner_phone, role: 'merchant' },
          message: 'تم إنشاء المتجر والمستخدم بنجاح'
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Login endpoint
    app.post("/api/login", async (req, res) => {
      try {
        const { phone, password } = req.body;
        
        // Try users table first
        let result = await pool.query(
          "SELECT * FROM users WHERE phone = $1",
          [phone]
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          
          // Verify password
          if (user.password !== password) {
            return res.status(401).json({ error: "❌ رقم الهاتف أو رمز الدخول غير صحيحة" });
          }
          
          // Get store info if user is a merchant
          let store_type = null;
          let store_active = true;
          let store_status = 'active';
          let store_slug = null;
          if (user.role === 'merchant' && user.store_id) {
            const storeResult = await pool.query(
              "SELECT store_type, is_active, status, slug FROM stores WHERE id = $1",
              [user.store_id]
            );
            if (storeResult.rows.length > 0) {
              store_type = storeResult.rows[0].store_type;
              store_active = storeResult.rows[0].is_active;
              store_status = storeResult.rows[0].status;
              store_slug = storeResult.rows[0].slug;
            }
          }
          
          return res.json({
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            email: user.email,
            store_id: user.store_id,
            store_slug: store_slug,
            store_type: store_type,
            store_active: store_active,
            store_status: store_status
          });
        }
        
        // If not found in users, try customers table (for customer login)
        result = await pool.query(
          "SELECT id, name, phone, email, store_id, customer_type, password FROM customers WHERE phone = $1",
          [phone]
        );
        
        if (result.rows.length > 0) {
          const customer = result.rows[0];
          
          // Verify password
          if (!customer.password || customer.password !== password) {
            return res.status(401).json({ error: "❌ رقم الهاتف أو رمز الدخول غير صحيحة" });
          }
          
          // Get store info
          const storeResult = await pool.query(
            "SELECT store_type FROM stores WHERE id = $1",
            [customer.store_id]
          );
          let store_type = storeResult.rows.length > 0 ? storeResult.rows[0].store_type : 'regular';
          
          return res.json({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            role: 'customer',
            customer_type: customer.customer_type, // إرجاع نوع العميل
            store_id: customer.store_id,
            store_type: store_type
          });
        }
        
        return res.status(401).json({ error: "❌ رقم الهاتف أو رمز الدخول غير صحيحة" });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Verify user session endpoint
    app.post("/api/verify-session", async (req, res) => {
      try {
        const { userId, role } = req.body;

        if (!userId || !role) {
          return res.status(400).json({ error: "Missing userId or role" });
        }

        if (role === 'admin') {
          // Check if admin user still exists
          const result = await pool.query(
            "SELECT id, name, phone, email, role FROM users WHERE id = $1 AND role = $2",
            [userId, role]
          );
          
          if (result.rows.length === 0) {
            return res.status(401).json({ error: "User session invalid" });
          }
          
          return res.json({ valid: true, user: result.rows[0] });
        } else if (role === 'merchant') {
          // Check if merchant user still exists
          const result = await pool.query(
            "SELECT id, name, phone, email, role, store_id FROM users WHERE id = $1 AND role = $2",
            [userId, role]
          );
          
          if (result.rows.length === 0) {
            return res.status(401).json({ error: "User session invalid" });
          }
          
          return res.json({ valid: true, user: result.rows[0] });
        } else if (role === 'customer') {
          // Check if customer still exists
          const result = await pool.query(
            "SELECT id, name, phone, email FROM customers WHERE id = $1",
            [userId]
          );
          
          if (result.rows.length === 0) {
            return res.status(401).json({ error: "User session invalid" });
          }
          
          return res.json({ valid: true, user: result.rows[0] });
        }

        return res.status(400).json({ error: "Invalid role" });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Register merchant endpoint
    app.post("/api/register-merchant", async (req, res) => {
      try {
        const { name, phone, email, password, store_name, category, storeType } = req.body;
        
        // Validate required fields (email is optional)
        if (!name || !phone || !password || !store_name) {
          return res.status(400).json({ error: 'الاسم والهاتف وكلمة المرور واسم المتجر مطلوبة' });
        }
        
        let userId;
        const userCheck = await pool.query("SELECT id FROM users WHERE phone = $1", [phone]);
        
        if (userCheck.rows.length > 0) {
          userId = userCheck.rows[0].id;
        } else {
          const userResult = await pool.query(
            "INSERT INTO users (name, phone, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [name, phone, email || null, password, 'merchant']
          );
          userId = userResult.rows[0].id;
        }

        let storeSlug = createSlug(store_name || 'store');
        
        // Check if slug already exists and make it unique
        const slugCheck = await pool.query("SELECT id FROM stores WHERE slug = $1", [storeSlug]);
        if (slugCheck.rows.length > 0) {
          storeSlug = `${storeSlug}-${Date.now()}`;
        }
        
        const storeResult = await pool.query(
          "INSERT INTO stores (owner_id, store_name, owner_name, owner_phone, slug, category, store_type, is_active, status) VALUES ($1, $2, $3, $4, $5, $6, $7, false, 'pending') RETURNING *",
          [userId, store_name, name, phone, storeSlug, category || 'عام', storeType || 'regular']
        );

        const storeId = storeResult.rows[0].id;
        // ❌ DISABLED: Don't auto-seed companies, merchants manage them via API
        /*
        // If it's a topup store, seed default providers and categories (not products - let merchant add them)
        if (storeType === 'topup') {
          const defaultCompanies = [
            { name: "Zain", logo_url: "https://via.placeholder.com/100?text=Zain" },
            { name: "Asiacell", logo_url: "https://via.placeholder.com/100?text=Asiacell" },
            { name: "Ooredoo", logo_url: "https://via.placeholder.com/100?text=Ooredoo" },
            { name: "HaloTel", logo_url: "https://via.placeholder.com/100?text=HaloTel" }
          ];

          // Insert default companies
          for (const company of defaultCompanies) {
            await pool.query(
              `INSERT INTO topup_companies (store_id, name, logo_url) VALUES ($1, $2, $3)`,
              [storeId, company.name, company.logo_url]
            );
          }
        }
        */

        // Update user with store_id
        await pool.query(
          "UPDATE users SET store_id = $1 WHERE id = $2",
          [storeId, userId]
        );

        res.json({
          user: { id: userId, name, phone, role: 'merchant', store_id: storeId },
          store: storeResult.rows[0]
        });
      } catch (error) {
        console.error("Register merchant error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get app settings
    app.get("/api/settings", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        const role = req.query.role as string;
        
        // Only fetch store settings if storeId is provided (regardless of role)
        if (storeId && storeId !== '' && storeId !== 'undefined' && storeId !== 'NaN' && !isNaN(Number(storeId))) {
          // Get store-specific settings from stores table
          const result = await pool.query(
            "SELECT store_name as app_name, logo_url, primary_color, commission_percentage FROM stores WHERE id = $1",
            [parseInt(storeId)]
          );
          
          if (result.rows.length > 0) {
            console.log(`✅ Loaded store settings for storeId: ${storeId}`);
            return res.json(result.rows[0]);
          } else {
            // Store not found - return error instead of falling back to admin
            console.warn(`⚠️  Store not found for storeId: ${storeId}`);
            return res.status(404).json({ 
              error: "المتجر غير موجود أو لم تتم إضافته بعد",
              app_name: "",
              logo_url: "",
              primary_color: "#4F46E5"
            });
          }
        }
        
        // Get admin settings from app_settings table (when role=admin or no storeId)
        const result = await pool.query("SELECT * FROM app_settings LIMIT 1");
        console.log(`✅ Loaded admin settings`);
        res.json(result.rows.length > 0 ? result.rows[0] : {
          app_name: "منصتي",
          logo_url: "",
          primary_color: "#4F46E5",
          commission_percentage: 0,
          admin_commission_percentage: 5
        });
      } catch (error) {
        console.error("GET /api/settings error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // update app settings
    app.post("/api/settings", async (req, res) => {
      try {
        const { store_id, app_name, logo_url, primary_color, commission_percentage, admin_commission_percentage } = req.body;
        
        const reqBodySize = JSON.stringify(req.body).length;
        console.log("📥 POST /api/settings received:", { 
          store_id, 
          has_app_name: app_name !== undefined,
          has_logo_url: logo_url !== undefined,
          logo_url_length: logo_url ? logo_url.length : 0,
          has_primary_color: primary_color !== undefined,
          has_commission_percentage: commission_percentage !== undefined,
          has_admin_commission_percentage: admin_commission_percentage !== undefined,
          request_body_size: `${(reqBodySize / 1024).toFixed(2)} KB`
        });
        
        // If logo_url is too large (over 2MB), reject it
        if (logo_url && logo_url.length > 2 * 1024 * 1024) {
          console.error("❌ Logo URL too large:", (logo_url.length / 1024 / 1024).toFixed(2) + " MB");
          return res.status(400).json({ 
            message: "الصورة كبيرة جداً", 
            success: false, 
            error: "حجم الصورة يجب ألا يتجاوز 2 MB" 
          });
        }
        
        // If store_id is provided, update store settings
        if (store_id) {
          const storeIdInt = parseInt(store_id);
          console.log(`🔄 Updating store settings for store_id: ${storeIdInt}`);
          let updateQuery = "UPDATE stores SET ";
          let updates: any[] = [];
          let paramIndex = 1;
          let values = [];
          
          if (app_name !== undefined) {
            updates.push(`store_name = $${paramIndex++}`);
            // Trim whitespace and handle empty strings
            values.push(app_name.trim() === '' ? null : app_name);
          }
          if (logo_url !== undefined) {
            updates.push(`logo_url = $${paramIndex++}`);
            values.push(logo_url);
          }
          if (primary_color !== undefined) {
            updates.push(`primary_color = $${paramIndex++}`);
            values.push(primary_color);
          }
          if (commission_percentage !== undefined) {
            updates.push(`commission_percentage = $${paramIndex++}`);
            values.push(commission_percentage);
          }
          
          // If updates.length === 0, it means no valid fields were provided
          if (updates.length === 0) {
            console.log("✅ No updates provided, returning success");
            return res.status(200).json({ message: "No updates", success: true });
          }
          
          // Add updated_at timestamp for store
          updates.push(`updated_at = CURRENT_TIMESTAMP`);
          updateQuery += updates.join(", ") + ` WHERE id = $${paramIndex} RETURNING *`;
          values.push(storeIdInt);
          
          console.log("🔍 Update query columns:", updates);
          console.log("📊 Update values:", values);
          console.log("📝 Final SQL Query:", updateQuery);
          
          let result;
          try {
            result = await pool.query(updateQuery, values);
          } catch (dbError) {
            console.error("❌ Database Error:", dbError);
            return res.status(500).json({ 
              message: "Database error", 
              success: false, 
              error: (dbError as any).message || "Database operation failed"
            });
          }
          
          if (result.rows.length === 0) {
            console.warn(`⚠️  Store with id ${storeIdInt} not found for update`);
            return res.status(400).json({ message: "Store not found", success: false, error: "المتجر غير موجود" });
          }
          
          console.log(`✅ Store settings updated for store_id: ${storeIdInt}`, result.rows[0]);
          const successResponse = { 
            message: "Store settings updated", 
            success: true, 
            store: result.rows[0],
            timestamp: new Date().toISOString()
          };
          console.log("🔵 Sending response:", JSON.stringify(successResponse, null, 2));
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json(successResponse);
        }
        
        // Otherwise update admin settings
        // Check if settings exist
        const existingCheck = await pool.query("SELECT id FROM app_settings LIMIT 1");
        
        if (existingCheck.rows.length > 0) {
            // Get the ID of existing settings
          const existingId = existingCheck.rows[0].id;
          
          // Update existing settings
          let updateQuery = "UPDATE app_settings SET ";
          let updates: any[] = [];
          let paramIndex = 1;
          let values = [];
          
          if (app_name !== undefined) {
            updates.push(`app_name = $${paramIndex++}`);
            values.push(app_name);
          }
          if (logo_url !== undefined) {
            updates.push(`logo_url = $${paramIndex++}`);
            values.push(logo_url);
          }
          if (primary_color !== undefined) {
            updates.push(`primary_color = $${paramIndex++}`);
            values.push(primary_color);
          }
          if (admin_commission_percentage !== undefined) {
            updates.push(`admin_commission_percentage = $${paramIndex++}`);
            values.push(admin_commission_percentage);
          }
          
          if (updates.length === 0) {
            return res.status(200).json({ message: "No updates", success: true });
          }
          
          updates.push(`updated_at = CURRENT_TIMESTAMP`);
          updateQuery += updates.join(", ") + ` WHERE id = $${paramIndex} RETURNING *`;
          values.push(existingId);
          
          const result = await pool.query(updateQuery, values);
          return res.status(200).json({ message: "Settings updated successfully", success: true, settings: result.rows[0] });
        } else {
          // Insert new settings if none exist
          const result = await pool.query(
            "INSERT INTO app_settings (app_name, logo_url, primary_color, admin_commission_percentage) VALUES ($1, $2, $3, $4) RETURNING *",
            [app_name, logo_url, primary_color, admin_commission_percentage]
          );
          return res.status(200).json({ message: "Settings created successfully", success: true, settings: result.rows[0] });
        }
      } catch (error) {
        console.error("CRITICAL SETTINGS ERROR:", error);
        if (error instanceof Error) {
          console.error("Stack Trace:", error.stack);
        }
        const errorMessage = (error as any).message || "Unknown error";
        console.error("Returning error to client:", errorMessage);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          error: errorMessage,
          message: errorMessage,
          success: false,
          details: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
        });
      }
    });

    // Get orders
    app.get("/api/orders", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        let query = "";
        let params: any[] = [];
        
        if (storeId) {
          query = `SELECT 
                      o.id,
                      o.customer_id,
                      o.topup_customer_id,
                      o.store_id,
                      o.total_amount,
                      o.discount_amount,
                      o.status,
                      o.phone,
                      o.address,
                      o.is_topup_order,
                      o.created_at,
                      o.customer_type,
                      o.payment_status,
                      s.subscription_paid,
                      s.owner_name,
                      s.store_name,
                      s.percentage_enabled 
                   FROM orders o 
                   LEFT JOIN stores s ON o.store_id = s.id 
                   WHERE o.store_id = $1 
                   ORDER BY o.created_at DESC`;
          params = [parseInt(storeId)];
          console.log(`📋 Fetching orders for store: ${storeId}`);
        } else {
          // When no storeId filter, get all orders with store info
          query = `SELECT 
                      o.id,
                      o.customer_id,
                      o.topup_customer_id,
                      o.store_id,
                      o.total_amount,
                      o.discount_amount,
                      o.status,
                      o.phone,
                      o.address,
                      o.is_topup_order,
                      o.created_at,
                      o.customer_type,
                      o.payment_status,
                      s.subscription_paid,
                      s.owner_name,
                      s.store_name,
                      s.percentage_enabled 
                   FROM orders o 
                   LEFT JOIN stores s ON o.store_id = s.id 
                   ORDER BY o.created_at DESC`;
        }
        
        const result = await pool.query(query, params);
        console.log(`📋 Found ${result.rows.length} orders with store info`);
        
        // Log first order for debugging
        if (result.rows.length > 0) {
          console.log(`📋 Sample order:`, JSON.stringify(result.rows[0]));
        }
        
        res.json(result.rows);
      } catch (error) {
        console.error("Orders fetch error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create order
    app.post("/api/orders", async (req, res) => {
      try {
        const { customer_id, store_id, total_amount, phone, address, is_topup, items, discount_amount } = req.body;
        
        // For topup orders: use topup_customer_id; for regular orders: use customer_id
        const topupCustomerId = is_topup ? customer_id : null;
        const regularCustomerId = !is_topup ? customer_id : null;
        
        // Insert the order with proper foreign keys
        const orderResult = await pool.query(
          "INSERT INTO orders (customer_id, topup_customer_id, store_id, total_amount, discount_amount, phone, address, is_topup_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
          [regularCustomerId, topupCustomerId, store_id, total_amount, discount_amount || 0, phone, address, is_topup || false]
        );
        
        const order = orderResult.rows[0];
        
        // NOTE: Do NOT update current_debt here!
        // Debt is calculated dynamically from orders table in statement endpoint
        // This prevents double-counting
        
        const extractedCodes: string[] = [];
        
        // Insert order items and update product stock
        if (items && Array.isArray(items)) {
          for (const item of items) {
            let topupCodes: string[] = [];
            
            // For topup products, extract codes from the product
            if (is_topup && item.topup_codes) {
              // Get current codes from product
              const productResult = await pool.query(
                "SELECT topup_codes FROM products WHERE id = $1",
                [item.product_id]
              );
              
              if (productResult.rows.length > 0) {
                const currentCodes = productResult.rows[0].topup_codes || [];
                // Extract requested quantity of codes
                topupCodes = currentCodes.slice(0, item.quantity);
                const remainingCodes = currentCodes.slice(item.quantity);
                
                // Update product with remaining codes
                await pool.query(
                  "UPDATE products SET topup_codes = $1, stock = $2 WHERE id = $3",
                  [remainingCodes, remainingCodes.length, item.product_id]
                );
                
                extractedCodes.push(...topupCodes);
                console.log(`🔑 [TOPUP] Extracted ${item.quantity} codes from product ${item.product_id}, ${remainingCodes.length} remaining`);
              }
            }
            
            // Insert order item with topup codes if applicable
            if (is_topup && topupCodes.length > 0) {
              await pool.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price, topup_codes) VALUES ($1, $2, $3, $4, $5)",
                [order.id, item.product_id, item.quantity, item.price, topupCodes]
              );
            } else {
              // Regular product order
              await pool.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [order.id, item.product_id, item.quantity, item.price]
              );
              
              // Update product stock for regular products
              const stockUpdate = await pool.query(
                "UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock",
                [item.quantity, item.product_id]
              );
              
              console.log(`📦 [ORDER] Updated product ${item.product_id}: -${item.quantity} units, remaining stock: ${stockUpdate.rows[0]?.stock || 0}`);
            }
          }
        }
        
        // Return order with extracted codes for topup orders
        const responseOrder = {
          ...order,
          topup_codes: extractedCodes
        };
        
        res.json(responseOrder);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update order status
    app.patch("/api/orders/:id/status", async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
          return res.status(400).json({ error: "Status is required" });
        }
        
        const result = await pool.query(
          "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
          [status, parseInt(id)]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Order not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Return order (delete it)
    app.patch("/api/orders/:id/return", async (req, res) => {
      const client = await pool.connect();
      try {
        const { id } = req.params;
        const orderId = parseInt(id);
        
        console.log(`🗑️  [RETURN ORDER] Starting deletion for order ID: ${orderId}`);
        
        await client.query('BEGIN');
        
        // Get order items first to restore stock
        const itemsResult = await client.query(
          "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
          [orderId]
        );
        console.log(`🗑️  [RETURN ORDER] Found ${itemsResult.rowCount} order items to restore stock`);
        
        // Restore stock for each product
        for (const item of itemsResult.rows) {
          const stockUpdate = await client.query(
            "UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING stock",
            [item.quantity, item.product_id]
          );
          console.log(`📦 [RETURN ORDER] Restored product ${item.product_id}: +${item.quantity} units, new stock: ${stockUpdate.rows[0]?.stock || 0}`);
        }
        
        // Delete order items
        const deleteItemsResult = await client.query(
          "DELETE FROM order_items WHERE order_id = $1",
          [orderId]
        );
        console.log(`🗑️  [RETURN ORDER] Deleted ${deleteItemsResult.rowCount} order items`);
        
        // Get the order details before deletion to update customer debt
        const orderResult = await client.query(
          "SELECT id, customer_id, total_amount, discount_amount FROM orders WHERE id = $1",
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          await client.query('ROLLBACK');
          console.log(`❌ [RETURN ORDER] Order not found: ${orderId}`);
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orderResult.rows[0];
        const orderAmount = order.total_amount - (order.discount_amount || 0);

        // Update customer debt (reduce by order amount)
        if (order.customer_id) {
          const debtUpdateRes = await client.query(
            `UPDATE customers SET current_debt = GREATEST(0, current_debt - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING current_debt`,
            [orderAmount, order.customer_id]
          );
          console.log(`💳 [RETURN ORDER] Customer ${order.customer_id} debt reduced by ${orderAmount}. New debt: ${debtUpdateRes.rows[0]?.current_debt || 0}`);
        }

        // Then delete the order
        const result = await client.query(
          "DELETE FROM orders WHERE id = $1 RETURNING *",
          [orderId]
        );
        
        console.log(`🗑️  [RETURN ORDER] Delete result rows: ${result.rowCount}`);
        
        await client.query('COMMIT');
        console.log(`✅ [RETURN ORDER] Successfully deleted order: ${orderId}`);
        res.json({ message: "تم حذف الطلب بنجاح", success: true, deleted: result.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ [RETURN ORDER] Error:`, error);
        res.status(500).json({ error: (error as any).message });
      } finally {
        client.release();
      }
    });

    // Get order invoice
    app.get("/api/orders/:id/invoice", async (req, res) => {
      try {
        const { id } = req.params;
        
        const orderResult = await pool.query(
          "SELECT o.*, s.store_name, s.logo_url FROM orders o LEFT JOIN stores s ON o.store_id = s.id WHERE o.id = $1",
          [parseInt(id)]
        );
        
        if (orderResult.rows.length === 0) {
          return res.status(404).json({ error: "Order not found" });
        }
        
        const order = orderResult.rows[0];
        
        const itemsResult = await pool.query(
          "SELECT oi.*, p.name as product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1",
          [parseInt(id)]
        );

        // Format currency function
        const formatCurrency = (amount: any) => {
          const num = parseInt(amount);
          return `${num.toLocaleString('en-US')} IQD`;
        };
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'El Messiri', serif; font-size: 14px; margin: 20px; direction: rtl; }
              .invoice { max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .header { display: flex; flex-direction: column; align-items: center; gap: 15px; }
              .header img { max-width: 150px; height: auto; }
              .header h1 { margin: 0; font-size: 18px; }
              .customer-info { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
              .customer-info h3 { margin: 0 0 10px 0; font-size: 14px; font-weight: bold; }
              .info { margin-bottom: 20px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
              th { background: #f5f5f5; }
              .total { margin: 20px 0; text-align: right; font-size: 18px; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
          </head>
          <body dir="rtl">
            <div class="invoice">
              <div class="header">
                ${order.logo_url ? `<img src="${order.logo_url}" alt="شعار المتجر">` : ''}
                <h1>${order.store_name || 'متجر'}</h1>
              </div>
              <div class="info" dir="rtl">
                <div class="info-row">
                  <span>رقم الطلب: ${order.id}</span>
                  <span>التاريخ: ${new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <div class="info-row">
                  <span>المتجر: ${order.store_name || 'متجر'}</span>
                  <span>الحالة: ${order.status}</span>
                </div>
              </div>
              <div class="customer-info">
                <h3>🔹 معلومات العميل</h3>
                <div class="info-row">
                  <span>الهاتف: ${order.phone || '---'}</span>
                </div>
                <div class="info-row">
                  <span>العنوان: ${order.address || 'لم يتم تحديد عنوان'}</span>
                </div>
              </div>
              <table dir="rtl" style="text-align: right;">
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                </tr>
                ${itemsResult.rows.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                  </tr>
                `).join('')}
                <tr style="font-weight: bold; background: #f5f5f5;">
                  <td>الإجمالي</td>
                  <td></td>
                  <td>${formatCurrency(order.total_amount)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                  <tr style="color: green;">
                    <td>الخصم</td>
                    <td></td>
                    <td>-${formatCurrency(order.discount_amount)}</td>
                  </tr>
                ` : ''}
              </table>
              <div class="footer">
                <p>شكراً لتعاملك معنا</p>
              </div>
            </div>
            <script>
              window.print();
            </script>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get order items
    app.get("/api/orders/:id/items", async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await pool.query(
          "SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1",
          [parseInt(id)]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Validate coupon
    app.post("/api/coupons/validate", async (req, res) => {
      try {
        const { code, store_id } = req.body;
        // Placeholder: You can expand this with actual coupon logic
        res.json({
          valid: true,
          discount: 0,
          code: code
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Merchant stats
    app.get("/api/merchant/stats", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        
        if (!storeId || isNaN(Number(storeId))) {
          return res.json({
            totalRevenue: 0,
            netRevenue: 0,
            adminCommission: 0,
            orderStats: { total: 0, pending: 0, completed: 0 },
            topProducts: []
          });
        }

        const storeIdNum = parseInt(storeId);

        // Get store info for commission calculation
        const storeResult = await pool.query(
          "SELECT percentage_enabled, commission_percentage FROM stores WHERE id = $1",
          [storeIdNum]
        );
        const percentageEnabled = storeResult.rows.length > 0 ? storeResult.rows[0].percentage_enabled : false;
        const commissionPercentage = storeResult.rows.length > 0 ? parseFloat(storeResult.rows[0].commission_percentage) : 0;

        // Get total revenue (only completed orders)
        const revenueResult = await pool.query(
          "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE store_id = $1 AND status = 'completed'",
          [storeIdNum]
        );
        const totalRevenue = parseFloat(revenueResult.rows[0].total);
        
        // Calculate admin commission
        let adminCommission = 0;
        if (percentageEnabled && commissionPercentage > 0) {
          adminCommission = Math.floor(totalRevenue * (commissionPercentage / 100));
        }
        const netRevenue = totalRevenue - adminCommission;

        // Get order stats
        const totalOrdersResult = await pool.query(
          "SELECT COUNT(*) as count FROM orders WHERE store_id = $1",
          [storeIdNum]
        );
        const total = parseInt(totalOrdersResult.rows[0].count);

        const pendingOrdersResult = await pool.query(
          "SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND status = 'pending'",
          [storeIdNum]
        );
        const pending = parseInt(pendingOrdersResult.rows[0].count);

        const completedOrdersResult = await pool.query(
          "SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND status = 'completed'",
          [storeIdNum]
        );
        const completed = parseInt(completedOrdersResult.rows[0].count);

        // Get top products (sold products) - only products with actual sales
        const topProductsResult = await pool.query(
          `SELECT p.id, p.name, COUNT(oi.id) as sales_count, COALESCE(SUM(oi.quantity), 0) as total_units,
                  COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
           FROM products p
           LEFT JOIN order_items oi ON p.id = oi.product_id
           LEFT JOIN orders o ON oi.order_id = o.id AND o.store_id = $1
           WHERE p.store_id = $1
           GROUP BY p.id, p.name
           HAVING COUNT(oi.id) > 0
           ORDER BY sales_count DESC
           LIMIT 5`,
          [storeIdNum]
        );
        const topProducts = topProductsResult.rows;

        res.json({
          totalRevenue,
          netRevenue,
          adminCommission,
          orderStats: { total, pending, completed },
          topProducts
        });
      } catch (error) {
        console.error("Merchant stats error:", error);
        res.json({
          totalRevenue: 0,
          netRevenue: 0,
          adminCommission: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          topProducts: []
        });
      }
    });

    // Admin stats
    app.get("/api/admin/stats", async (req, res) => {
      try {
        const salesStatuses = ['pending', 'completed'];
        const storesResult = await pool.query("SELECT COUNT(*) as count FROM stores WHERE is_active = true");
        const ordersResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = ANY($1::text[])", [salesStatuses]);
        const customersResult = await pool.query("SELECT COUNT(DISTINCT customer_id) as count FROM orders WHERE customer_id IS NOT NULL AND status = ANY($1::text[])", [salesStatuses]);
        const usersResult = await pool.query("SELECT COUNT(*) as count FROM users");
        const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = ANY($1::text[])", [salesStatuses]);
        
        // Calculate commission from stores that have percentage_enabled = true across sales orders.
        const commissionPerStoreResult = await pool.query(`
          SELECT 
            s.id,
            s.percentage_enabled,
            s.commission_percentage,
            COALESCE(SUM(o.total_amount), 0) as store_revenue
          FROM stores s
          LEFT JOIN orders o ON s.id = o.store_id AND o.status = ANY($1::text[])
          WHERE s.is_active = true
          GROUP BY s.id, s.percentage_enabled, s.commission_percentage
        `, [salesStatuses]);
        
        let totalAdminCommission = 0;
        commissionPerStoreResult.rows.forEach((row: any) => {
          const storeRevenue = parseFloat(row.store_revenue);
          const commissionPercent = parseFloat(row.commission_percentage);
          const percentageEnabled = row.percentage_enabled;
          
          if (percentageEnabled && commissionPercent > 0 && storeRevenue > 0) {
            const commission = Math.floor(storeRevenue * (commissionPercent / 100));
            totalAdminCommission += commission;
            console.log(`📊 Store ${row.id}: Revenue=${storeRevenue}, Commission%=${commissionPercent}, Commission=${commission}`);
          }
        });
        
        const totalRevenue = parseFloat(revenueResult.rows[0].total);
        const merchantRevenue = totalRevenue - totalAdminCommission;
        
        // Get admin commission percentage from settings (fallback if no per-store commission)
        const settingsResult = await pool.query("SELECT admin_commission_percentage FROM app_settings ORDER BY id DESC LIMIT 1");
        const globalAdminCommissionPercentage = settingsResult.rows.length > 0 ? parseFloat(settingsResult.rows[0].admin_commission_percentage) : 0;
        
        console.log(`💰 Admin Stats: Stores=${storesResult.rows[0].count}, Orders=${ordersResult.rows[0].count}, Customers=${customersResult.rows[0].count}, Revenue=${totalRevenue}, Commission=${totalAdminCommission}`);
        
        res.json({
          totalStores: parseInt(storesResult.rows[0].count),
          totalOrders: parseInt(ordersResult.rows[0].count),
          totalUsers: parseInt(usersResult.rows[0].count),
          totalCustomers: parseInt(customersResult.rows[0].count),
          totalRevenue: totalRevenue,
          adminCommissionPercentage: globalAdminCommissionPercentage,
          adminCommission: totalAdminCommission,
          merchantRevenue: merchantRevenue
        });
      } catch (error) {
        console.error("Admin stats error:", error);
        res.status(200).json({
          totalStores: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          adminCommissionPercentage: 0,
          adminCommission: 0,
          merchantRevenue: 0
        });
      }
    });

    // Add user (for creating customers/guests)
    app.post("/api/admin/add-user", async (req, res) => {
      try {
        const { name, phone, role, password, email } = req.body;

        if (!phone || !role) {
          return res.status(400).json({ error: 'Phone and role are required' });
        }

        // Check if user with this phone already exists
        const existingUser = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
        
        if (existingUser.rows.length > 0) {
          // Return existing user
          return res.json(existingUser.rows[0]);
        }

        // Create new user
        const result = await pool.query(
          "INSERT INTO users (name, phone, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, name, phone, email, role",
          [name || phone, phone, email || null, password || 'guest123', role]
        );

        console.log(`✅ [USER] Created ${role}: ${phone}`);
        res.json(result.rows[0]);
      } catch (error) {
        console.error("Add user error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get customers with order details
    app.get("/api/admin/customers", async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT 
            u.id,
            u.name,
            u.phone,
            u.email,
            COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_spending,
            MAX(o.created_at) as last_order_date
          FROM users u
          LEFT JOIN orders o ON u.id = o.customer_id
          WHERE u.role = 'customer'
          GROUP BY u.id, u.name, u.phone, u.email
          ORDER BY total_spending DESC, u.id DESC
        `);
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Admin users
    app.get("/api/admin/users", async (req, res) => {
      try {
        const result = await pool.query("SELECT id, name, phone, email, role, created_at FROM users ORDER BY created_at DESC");
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get users with admin access (admins + merchants with can_access_admin = true)
    app.get("/api/admin/admin-users", async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT id, name, phone, email, role, can_access_admin, created_at 
          FROM users 
          WHERE role = 'admin' OR can_access_admin = true
          ORDER BY role DESC, created_at DESC
        `);
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Toggle admin access for a user
    app.put("/api/admin/users/:userId/admin-access", async (req, res) => {
      try {
        const { userId } = req.params;
        const { canAccessAdmin } = req.body;

        const result = await pool.query(
          "UPDATE users SET can_access_admin = $1 WHERE id = $2 AND role != 'admin' RETURNING id, name, phone, role, can_access_admin",
          [canAccessAdmin, parseInt(userId)]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found or cannot modify admin user" });
        }

        const user = result.rows[0];
        console.log(`✅ [ADMIN ACCESS] User ${user.name} (${user.phone}) - can_access_admin: ${user.can_access_admin}`);
        
        res.json({ message: "Admin access updated", user: result.rows[0] });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete user safely (delete associated stores first)
    app.delete("/api/admin/users/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        
        // First, delete all stores owned by this user
        await pool.query("DELETE FROM stores WHERE owner_id = $1", [parseInt(userId)]);
        
        // Then delete the user
        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [parseInt(userId)]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        
        res.json({ message: "User and associated stores deleted successfully", userId: result.rows[0].id });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get pending stores (awaiting approval)
    app.get("/api/admin/pending-stores", async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT s.*, u.name as owner_name_from_user, u.phone as owner_phone_from_user, u.email as owner_email_from_user
          FROM stores s
          LEFT JOIN users u ON s.owner_id = u.id
          WHERE s.status = 'pending' OR (s.is_active = false AND s.status IS NULL)
          ORDER BY s.created_at DESC
        `);
        
        const stores = result.rows.map(store => ({
          ...store,
          owner_name: store.owner_name || store.owner_name_from_user || 'غير معروف',
          owner_phone: store.owner_phone || store.owner_phone_from_user || '',
          owner_email: store.owner_email || store.owner_email_from_user || ''
        }));
        
        res.json(stores);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete store (hard delete - remove from database)
    app.delete("/api/admin/delete-store/:id", async (req, res) => {
      try {
        const { id } = req.params;
        
        // Hard delete: actually remove the store from database
        const result = await pool.query(
          "DELETE FROM stores WHERE id = $1 RETURNING id, store_name",
          [parseInt(id)]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        res.json({ 
          message: "Store deleted successfully", 
          storeId: result.rows[0].id,
          storeName: result.rows[0].store_name 
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Admin orders report
    app.get("/api/admin/orders-report", async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT 
            o.id,
            o.store_id,
            o.customer_id,
            o.created_at,
            o.total_amount,
            o.discount_amount,
            o.status,
            o.phone,
            o.address,
            o.is_topup_order,
            o.customer_type,
            o.payment_status,
            s.store_name,
            s.subscription_paid,
            s.percentage_enabled,
            s.commission_percentage,
            COALESCE(s.owner_name, u.name, 'غير معروف') as owner_name,
            s.owner_phone,
            c.name as customer_name,
            CASE 
              WHEN s.percentage_enabled = true AND s.commission_percentage > 0 THEN 
                FLOOR(CAST(o.total_amount AS DECIMAL) * (CAST(s.commission_percentage AS DECIMAL) / 100))
              ELSE 0 
            END as commission_amount
          FROM orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN users u ON s.owner_id = u.id
          LEFT JOIN users c ON o.customer_id = c.id
          ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
      } catch (error) {
        console.error("Orders report error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get products
    app.get("/api/products", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        let query = "SELECT products.*, wholesale_price AS bulk_price, stores.store_name, stores.primary_color, stores.store_type, categories.name as category_name FROM products LEFT JOIN stores ON products.store_id = stores.id LEFT JOIN categories ON products.category_id = categories.id WHERE products.is_active = true AND (stores.store_type IS NULL OR stores.store_type != 'topup') ORDER BY products.created_at DESC";
        let params: any[] = [];
        
        if (storeId) {
          query = "SELECT products.*, wholesale_price AS bulk_price, stores.store_name, stores.primary_color, stores.store_type, categories.name as category_name FROM products LEFT JOIN stores ON products.store_id = stores.id LEFT JOIN categories ON products.category_id = categories.id WHERE products.store_id = $1 AND products.is_active = true AND (stores.store_type IS NULL OR stores.store_type != 'topup') ORDER BY products.created_at DESC";
          params = [parseInt(storeId)];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get merchant customers (distinct customers from orders)
    app.get("/api/merchant/customers", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        
        if (!storeId) {
          return res.json([]);
        }

        // First, get the store type to determine customer source
        const storeResult = await pool.query(`
          SELECT store_type FROM stores WHERE id = $1
        `, [parseInt(storeId)]);

        if (storeResult.rows.length === 0) {
          return res.json([]);
        }

        const storeType = storeResult.rows[0].store_type;

        // If topup store: Get customers from customers table (manually entered)
        if (storeType === 'topup') {
          const result = await pool.query(`
            SELECT 
              id as customer_id,
              id,
              store_id,
              name,
              phone,
              email,
              customer_type,
              credit_limit,
              current_debt,
              starting_balance,
              password,
              notes,
              is_active,
              created_at
            FROM customers
            WHERE store_id = $1
            ORDER BY created_at DESC
          `, [parseInt(storeId)]);

          // Calculate debt from orders for each topup customer
          const customersWithDebt = await Promise.all(
            result.rows.map(async (customer) => {
              console.log(`🔍 DEBUG: Searching debt for customer: "${customer.phone}"  Name: "${customer.name}" ID: ${customer.id}`);
              
              // Search debt by customer_id (accurate method)
              const debtResult = await pool.query(
                `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
                 FROM orders
                 WHERE store_id = $1 AND customer_id = $2`,
                [parseInt(storeId), customer.id]
              );
              let debtFromOrders = parseFloat(debtResult.rows[0]?.total_debt || 0);
              
              // If no results by customer_id and is_topup_order = true, fallback to phone for backward compatibility
              if (debtFromOrders === 0) {
                const fallbackResult = await pool.query(
                  `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
                   FROM orders
                   WHERE store_id = $1 AND phone = $2 AND is_topup_order = true`,
                  [parseInt(storeId), customer.phone]
                );
                debtFromOrders = parseFloat(fallbackResult.rows[0]?.total_debt || 0);
              }

              // Get total payments for this customer
              const paymentsResult = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) as total_payments
                 FROM customer_payments
                 WHERE store_id = $1 AND customer_id = $2`,
                [parseInt(storeId), customer.id]
              );
              const totalPayments = parseFloat(paymentsResult.rows[0]?.total_payments || 0);
              
              console.log(`📊 [TOPUP CUSTOMER] ${customer.name} (Phone: ${customer.phone}, ID: ${customer.id}) - Debt from orders: ${debtFromOrders} - Payments: ${totalPayments}`);
              
              return {
                ...customer,
                current_debt: Math.max(0, parseFloat(customer.starting_balance || 0) + debtFromOrders - totalPayments)
              };
            })
          );

          return res.json(customersWithDebt);
        }

        // If regular store: Get customers from orders (auto-populated)
        const result = await pool.query(`
          SELECT 
            o.phone,
            o.address,
            MIN(o.created_at) as created_at,
            COALESCE(SUM(o.total_amount - COALESCE(o.discount_amount, 0)), 0) as total_debt
          FROM orders o
          WHERE o.store_id = $1 AND o.phone IS NOT NULL
          GROUP BY o.phone, o.address
          ORDER BY MIN(o.created_at) DESC
        `, [parseInt(storeId)]);

        // Transform to match customer format
        const customers = result.rows.map((row: any, index: number) => ({
          customer_id: index,
          id: index,
          store_id: parseInt(storeId),
          name: row.phone || 'عميل مجهول',
          phone: row.phone,
          email: null,
          customer_type: 'cash',
          credit_limit: 0,
          current_debt: parseFloat(row.total_debt || 0),
          notes: null,
          is_active: true,
          created_at: row.created_at,
          is_from_orders: true
        }));

        res.json(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Failed to fetch customers" });
      }
    });

    // Get categories
    app.get("/api/categories", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        let query = "SELECT * FROM categories WHERE is_active = true";
        let params: any[] = [];
        
        if (storeId) {
          query += " AND store_id = $1";
          params = [parseInt(storeId)];
        }
        
        query += " ORDER BY created_at DESC";
        const result = await pool.query(query, params);
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete product
    app.delete("/api/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [parseInt(id)]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        res.json({ message: "Product deleted successfully", id: result.rows[0].id });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create product
    app.post("/api/products", async (req, res) => {
      try {
        const { store_id, category_id, name, price, stock, image_url, description, gallery = [] } = req.body;
        
        const result = await pool.query(
          "INSERT INTO products (store_id, category_id, name, price, stock, image_url, description, gallery, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *",
          [store_id, category_id || null, name, price, stock, image_url, description, JSON.stringify(gallery)]
        );
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update product
    app.put("/api/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { category_id, name, price, stock, image_url, description, gallery = [] } = req.body;
        
        const result = await pool.query(
          "UPDATE products SET category_id = $1, name = $2, price = $3, stock = $4, image_url = $5, description = $6, gallery = $7 WHERE id = $8 RETURNING *",
          [category_id || null, name, price, stock, image_url, description, JSON.stringify(gallery), parseInt(id)]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update product topup codes
    app.post("/api/products/update-codes", async (req, res) => {
      try {
        const { product_id, codes } = req.body;
        
        if (!product_id || !Array.isArray(codes) || codes.length === 0) {
          return res.status(400).json({ error: "Invalid product_id or codes" });
        }

        // Get existing codes first
        const existingResult = await pool.query(
          "SELECT topup_codes FROM products WHERE id = $1",
          [parseInt(product_id)]
        );

        if (existingResult.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        // Merge existing codes with new codes
        const existingCodes = existingResult.rows[0]?.topup_codes || [];
        const mergedCodes = [...existingCodes, ...codes];

        // Update with merged codes
        const result = await pool.query(
          "UPDATE products SET topup_codes = $1, stock = $2 WHERE id = $3 RETURNING *",
          [mergedCodes, mergedCodes.length, parseInt(product_id)]
        );
        
        console.log(`✅ Added ${codes.length} topup codes to product ${product_id}. Total codes: ${mergedCodes.length}`);
        res.json({ 
          success: true, 
          message: `تم إضافة ${codes.length} أكواد جديدة. العدد الكلي الآن: ${mergedCodes.length}`, 
          product: result.rows[0] 
        });
      } catch (error) {
        console.error("Error updating codes:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete category
    app.delete("/api/categories/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING id", [parseInt(id)]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        
        res.json({ message: "Category deleted successfully", id: result.rows[0].id });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create category
    app.post("/api/categories", async (req, res) => {
      try {
        const { store_id, name, image_url } = req.body;
        
        const result = await pool.query(
          "INSERT INTO categories (store_id, name, image_url, is_active) VALUES ($1, $2, $3, true) RETURNING *",
          [store_id, name, image_url]
        );
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update category
    app.put("/api/categories/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, image_url } = req.body;
        
        const result = await pool.query(
          "UPDATE categories SET name = $1, image_url = $2 WHERE id = $3 RETURNING *",
          [name, image_url, parseInt(id)]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Approve store endpoint
    app.post("/api/admin/approve-store/:id", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        const { phone } = req.body; // Get the custom phone from body
        
        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        // Get store details first
        const storeCheckResult = await pool.query(
          "SELECT id, owner_id, owner_phone, owner_name, store_type FROM stores WHERE id = $1",
          [storeId]
        );
        
        if (storeCheckResult.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        const store = storeCheckResult.rows[0];
        const phoneToUse = phone || store.owner_phone; // Use provided phone or fallback to owner_phone
        
        // Verify that the owner has a user account
        if (store.owner_id) {
          const userCheckResult = await pool.query(
            "SELECT id, store_id, phone FROM users WHERE id = $1",
            [store.owner_id]
          );
          
          if (userCheckResult.rows.length === 0) {
            console.warn(`⚠️ Store owner ${store.owner_id} not found in users table for store ${storeId}`);
            return res.status(400).json({ 
              error: "صاحب المتجر لا يملك حساب مستخدم. يرجى التحقق من بيانات المتجر." 
            });
          }
          
          // Make sure the user's store_id and phone are set correctly
          if (!userCheckResult.rows[0].store_id || userCheckResult.rows[0].phone !== phoneToUse) {
            await pool.query(
              "UPDATE users SET store_id = $1, phone = $2 WHERE id = $3",
              [storeId, phoneToUse, store.owner_id]
            );
            console.log(`✅ Updated user ${store.owner_id} with store_id ${storeId} and phone ${phoneToUse}`);
          }
        }
        
        // Update store status and phone
        const result = await pool.query(
          "UPDATE stores SET status = $1, is_active = $2, owner_phone = $3 WHERE id = $4 RETURNING *",
          ['approved', true, phoneToUse, storeId]
        );
        
        console.log(`✅ Store ${storeId} (${store.store_type}) approved successfully with phone ${phoneToUse}`);
        
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Approve store error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Reject store endpoint
    app.post("/api/admin/reject-store/:id", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        const result = await pool.query(
          "UPDATE stores SET status = $1, is_active = $2 WHERE id = $3 RETURNING *",
          ['rejected', false, storeId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Reject store error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Suspend store endpoint
    app.post("/api/admin/suspend-store/:id", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        const result = await pool.query(
          "UPDATE stores SET status = $1, is_active = $2 WHERE id = $3 RETURNING *",
          ['suspended', false, storeId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Suspend store error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Toggle store active/inactive status
    app.post("/api/admin/toggle-store/:id", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        // Get current store status
        const currentStore = await pool.query("SELECT is_active, status FROM stores WHERE id = $1", [storeId]);
        
        if (currentStore.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        const newIsActive = !currentStore.rows[0].is_active;
        const newStatus = newIsActive ? 'approved' : 'suspended';
        
        const result = await pool.query(
          "UPDATE stores SET is_active = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
          [newIsActive, newStatus, storeId]
        );
        
        console.log(`🔄 Store ${storeId} toggled: is_active changed from ${!newIsActive} to ${newIsActive}`);
        
        res.json({ success: true, store: result.rows[0], is_active: newIsActive });
      } catch (error) {
        console.error("Toggle store error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Save store logo to database
    app.post("/api/admin/stores/:id/logo", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        const { logo_url } = req.body;

        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }

        if (!logo_url) {
          return res.status(400).json({ error: "Logo URL is required" });
        }

        const result = await pool.query(
          "UPDATE stores SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
          [logo_url, storeId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }

        console.log(`✅ Store ${storeId} logo updated`);
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Store logo update error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Toggle subscription paid status endpoint
    app.put("/api/admin/stores/:id/toggle-subscription-paid", async (req, res) => {
      try {
        const rawId = req.params.id;
        const storeId = parseInt(rawId);
        const { subscription_paid } = req.body;
        
        console.log(`🔄 Toggle subscription request: rawId=${rawId}, parsedId=${storeId}, isNaN=${isNaN(storeId)}, subscription_paid=${subscription_paid}`);
        
        if (isNaN(storeId) || storeId <= 0) {
          console.error(`❌ Invalid store ID: ${rawId} → ${storeId}`);
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        if (subscription_paid === undefined || subscription_paid === null) {
          return res.status(400).json({ error: "subscription_paid field is required" });
        }
        
        const result = await pool.query(
          "UPDATE stores SET subscription_paid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
          [subscription_paid, storeId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        console.log(`✅ Store ${storeId} subscription updated to ${subscription_paid}`);
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Toggle subscription error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update store endpoint
    app.put("/api/admin/update-store/:id", async (req, res) => {
      try {
        const storeId = parseInt(req.params.id);
        const { store_name, owner_name, percentage_enabled } = req.body;
        
        if (isNaN(storeId) || storeId <= 0) {
          return res.status(400).json({ error: "Invalid store ID" });
        }
        
        // Build the update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (store_name !== undefined) {
          updates.push(`store_name = $${paramCount}`);
          values.push(store_name);
          paramCount++;
        }
        
        if (owner_name !== undefined) {
          updates.push(`owner_name = $${paramCount}`);
          values.push(owner_name);
          paramCount++;
        }
        
        if (percentage_enabled !== undefined) {
          updates.push(`percentage_enabled = $${paramCount}`);
          values.push(percentage_enabled);
          paramCount++;
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ error: "No fields to update" });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(storeId);
        
        const query = `UPDATE stores SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }
        
        res.json({ success: true, store: result.rows[0] });
      } catch (error) {
        console.error("Update store error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Fix user store_id mapping (admin utility endpoint)
    app.post("/api/admin/fix-user-store/:userId/:storeId", async (req, res) => {
      try {
        const { userId, storeId } = req.params;
        const result = await pool.query(
          "UPDATE users SET store_id = $1 WHERE id = $2 RETURNING id, name, phone, role, store_id",
          [parseInt(storeId), parseInt(userId)]
        );
        if (result.rows.length > 0) {
          res.json({ success: true, user: result.rows[0] });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      }catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Set/reset user password (admin utility endpoint)
    app.post("/api/admin/set-password/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const { password } = req.body;
        
        if (!password) {
          return res.status(400).json({ error: "Password is required" });
        }
        
        const result = await pool.query(
          "UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, phone, role",
          [password, parseInt(userId)]
        );
        if (result.rows.length > 0) {
          res.json({ success: true, message: `Password set for user ${result.rows[0].name}`, user: result.rows[0] });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ============ CUSTOMERS API ============

    // Get all customers for a store
    app.get("/api/customers", async (req, res) => {
      try {
        const { storeId, phone } = req.query;
        if (!storeId) return res.status(400).json({ error: "storeId required" });

        // إذا تم البحث برقم هاتف، رجع العميل الواحد
        if (phone) {
          const result = await pool.query(
            `SELECT * FROM customers WHERE store_id = $1 AND phone = $2 AND is_active = TRUE`,
            [parseInt(storeId as string), phone as string]
          );
          
          if (result.rows.length > 0) {
            return res.json(result.rows[0]);
          }
          return res.json(null);
        }

        // وإلا رجع جميع العملاء في المتجر
        const result = await pool.query(
          `SELECT * FROM customers WHERE store_id = $1 AND is_active = TRUE ORDER BY name ASC`,
          [parseInt(storeId as string)]
        );

        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create a new customer
    app.post("/api/customers", async (req, res) => {
      try {
        const { store_id, name, phone, email, customer_type, credit_limit, password, notes, starting_balance } = req.body;
        
        if (!store_id || !name || !phone) {
          return res.status(400).json({ error: "store_id, name, and phone are required" });
        }

        // Check that this is a topup store
        const storeCheck = await pool.query("SELECT store_type FROM stores WHERE id = $1", [store_id]);
        if (storeCheck.rows.length === 0 || storeCheck.rows[0].store_type !== 'topup') {
          return res.status(403).json({ error: "فقط متاجر الشحن يمكنها إضافة عملاء" });
        }

        const result = await pool.query(
          `INSERT INTO customers (store_id, name, phone, email, customer_type, credit_limit, password, notes, starting_balance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [store_id, name, phone, email || null, customer_type || 'cash', credit_limit || 0, password || null, notes || null, starting_balance || 0]
        );
        
        console.log(`✅ Customer created: ${name}`);
        res.json({ success: true, customer: result.rows[0] });
      } catch (error) {
        const err = error as any;
        if (err.code === '23505') {
          res.status(400).json({ error: "هذا الهاتف مسجل بالفعل لهذا المتجر" });
        } else {
          res.status(500).json({ error: err.message });
        }
      }
    });

    // Update customer
    app.put("/api/customers/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email, customer_type, credit_limit, password, notes, is_active, starting_balance } = req.body;

        // Get the customer first to get store_id
        const customerRes = await pool.query("SELECT store_id FROM customers WHERE id = $1", [parseInt(id)]);
        if (customerRes.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const storeId = customerRes.rows[0].store_id;

        // Check that this is a topup store
        const storeCheck = await pool.query("SELECT store_type FROM stores WHERE id = $1", [storeId]);
        if (storeCheck.rows.length === 0 || storeCheck.rows[0].store_type !== 'topup') {
          return res.status(403).json({ error: "فقط متاجر الشحن يمكنها تعديل بيانات العملاء" });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (email !== undefined) {
          updates.push(`email = $${paramCount++}`);
          values.push(email);
        }
        if (customer_type !== undefined) {
          updates.push(`customer_type = $${paramCount++}`);
          values.push(customer_type);
        }
        if (credit_limit !== undefined) {
          updates.push(`credit_limit = $${paramCount++}`);
          values.push(credit_limit);
        }
        if (password !== undefined) {
          updates.push(`password = $${paramCount++}`);
          values.push(password);
        }
        if (notes !== undefined) {
          updates.push(`notes = $${paramCount++}`);
          values.push(notes);
        }
        if (is_active !== undefined) {
          updates.push(`is_active = $${paramCount++}`);
          values.push(is_active);
        }
        if (starting_balance !== undefined) {
          updates.push(`starting_balance = $${paramCount++}`);
          values.push(starting_balance);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(parseInt(id));

        const result = await pool.query(
          `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        res.json({ success: true, customer: result.rows[0] });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete customer (soft delete - marks as inactive)
    app.delete("/api/customers/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const customerId = parseInt(id, 10);

        if (isNaN(customerId)) {
          return res.status(400).json({ error: "Invalid customer ID" });
        }

        console.log(`🗑️ [DELETE] Deleting customer: ${customerId}`);

        // Get the customer first to get store_id
        const customerRes = await pool.query("SELECT store_id, name, phone FROM customers WHERE id = $1", [customerId]);
        if (customerRes.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const storeId = customerRes.rows[0].store_id;
        const customer = customerRes.rows[0];

        // Check that this is a topup store
        const storeCheck = await pool.query("SELECT store_type FROM stores WHERE id = $1", [storeId]);
        if (storeCheck.rows.length === 0 || storeCheck.rows[0].store_type !== 'topup') {
          return res.status(403).json({ error: "فقط متاجر الشحن يمكنها حذف عملاء" });
        }

        // Permanently delete the customer
        const result = await pool.query(
          "DELETE FROM customers WHERE id = $1 RETURNING id, name",
          [customerId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        console.log(`✅ [DELETE] Customer deleted permanently: ${customer.name} (${customer.phone}) - ID: ${customerId}`);
        res.json({ success: true, message: "تم حذف العميل بنجاح", customer: result.rows[0] });
      } catch (error) {
        console.error(`❌ [DELETE] Error:`, error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get customer statement - كشف الحساب (REBUILT FROM SCRATCH)
    app.get("/api/customers/:id/statement", async (req, res) => {
      try {
        const customerId = parseInt(req.params.id);
        
        // Step 1: Fetch customer
        const customerRes = await pool.query(
          `SELECT id, name, phone, credit_limit, starting_balance, created_at 
           FROM customers WHERE id = $1`,
          [customerId]
        );

        if (customerRes.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customerRes.rows[0];

        // Step 2: Fetch all transactions (purchases/debits)
        const txRes = await pool.query(
          `SELECT id, customer_id, transaction_type as type, amount, description, created_at
           FROM customer_transactions WHERE customer_id = $1 ORDER BY created_at ASC`,
          [customerId]
        );

        // Step 3: Fetch all payments (credits)
        const payRes = await pool.query(
          `SELECT id, customer_id, amount, payment_method, notes as description, created_at
           FROM customer_payments WHERE customer_id = $1 ORDER BY created_at ASC`,
          [customerId]
        );

        // Step 4: Fetch topup orders for this customer (new source of debt)
        const topupOrdersRes = await pool.query(
          `SELECT id, total_amount - COALESCE(discount_amount, 0) as amount, created_at
           FROM orders WHERE topup_customer_id = $1 ORDER BY created_at ASC`,
          [customerId]
        );

        // Step 5: Use SAVED opening balance (starting_balance)
        const openingBalance = Number(customer.starting_balance) || 0;

        // Step 6: Combine all items and sort by date (oldest first)
        const allItems = [
          ...txRes.rows.map(t => ({
            id: t.id,
            type: t.type || 'purchase',
            description: t.description || 'عملية',
            amount: Number(t.amount),
            is_payment: false,
            created_at: t.created_at,
            source: 'transaction'
          })),
          ...payRes.rows.map(p => ({
            id: p.id,
            type: 'payment',
            description: p.description || 'دفعة',
            amount: Number(p.amount),
            is_payment: true,
            created_at: p.created_at,
            source: 'payment'
          })),
          ...topupOrdersRes.rows.map(o => ({
            id: o.id,
            type: 'topup',
            description: 'شراء',
            amount: Number(o.amount),
            is_payment: false,
            created_at: o.created_at,
            source: 'topup_order'
          }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Step 7: Calculate running balance (starting from opening balance)
        let runningBalance = openingBalance;
        const itemsWithBalance = allItems.map(item => {
          if (item.is_payment) {
            runningBalance -= item.amount;
          } else {
            runningBalance += item.amount;
          }
          return { ...item, balance: runningBalance };
        });

        // Step 8: Calculate final current_debt from last item balance
        const finalBalance = itemsWithBalance.length > 0 
          ? itemsWithBalance[itemsWithBalance.length - 1].balance 
          : openingBalance;

        // Step 9: Build final array with all items + opening balance, sorted descending by date (newest first)
        const allTransactions = [
          ...itemsWithBalance,
          {
            id: 0,
            type: 'opening',
            description: 'ديون سابقة',
            amount: openingBalance,
            balance: openingBalance,
            is_payment: false,
            created_at: customer.created_at
          }
        ];

        // Sort all transactions in descending order by date (newest first)
        const transactions = allTransactions.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        res.json({
          name: customer.name,
          phone: customer.phone,
          current_debt: finalBalance,
          credit_limit: Number(customer.credit_limit),
          starting_balance: Number(customer.starting_balance),
          transactions
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Add credit to customer (payment)
    app.post("/api/customers/:id/add-credit", async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({ error: "Valid amount required" });
        }

        // Update current_debt
        await pool.query(
          `UPDATE customers SET current_debt = current_debt - $1 WHERE id = $2`,
          [amount, parseInt(id)]
        );

        // Record transaction
        await pool.query(
          `INSERT INTO customer_transactions (customer_id, transaction_type, amount, description)
           VALUES ($1, $2, $3, $4)`,
          [parseInt(id), 'credit', amount, description || 'دفع']
        );

        const result = await pool.query(
          `SELECT * FROM customers WHERE id = $1`,
          [parseInt(id)]
        );

        console.log(`✅ Credit added to customer ${id}`);
        res.json({ success: true, customer: result.rows[0] });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Check credit availability before purchase
    app.post("/api/customers/:id/check-credit", async (req, res) => {
      try {
        const { id } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({ error: "Valid amount required" });
        }

        const result = await pool.query(
          `SELECT id, name, credit_limit, current_debt, customer_type FROM customers WHERE id = $1`,
          [parseInt(id)]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const customer = result.rows[0];
        const availableCredit = customer.credit_limit - customer.current_debt;
        const canProceed = availableCredit >= amount;
        const warningThreshold = customer.credit_limit * 0.8;
        const isNearLimit = (customer.current_debt + amount) >= warningThreshold;

        res.json({
          canProceed,
          isNearLimit,
          availableCredit,
          requestedAmount: amount,
          currentDebt: customer.current_debt,
          creditLimit: customer.credit_limit,
          message: canProceed 
            ? (isNearLimit ? `تحذير: الرصيد المتبقي: ${availableCredit - amount}` : "يمكن المتابعة")
            : `اعتذر: الرصيد المتاح ${availableCredit} أقل من المبلغ المطلوب ${amount}`
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ================== TOPUP STORE ENDPOINTS ==================
    
    // Topup Store Auth: Only registered customers can purchase
    app.post("/api/topup/auth", async (req, res) => {
      try {
        const { phone, password, store_id } = req.body;

        if (!phone || !password || !store_id) {
          return res.status(400).json({ error: "رقم الهاتف وكلمة المرور ومعرف المتجر مطلوبة" });
        }

        // Check if customer exists in the registered customers list for this topup store
        const customerResult = await pool.query(
          `SELECT id as customer_id, store_id, name, phone, email, customer_type, credit_limit, current_debt, password
           FROM customers 
           WHERE store_id = $1 AND phone = $2 AND is_active = true
           LIMIT 1`,
          [parseInt(store_id), phone]
        );

        if (customerResult.rows.length === 0) {
          return res.status(403).json({ 
            error: "❌ عذراً، رقم الهاتف غير مسجل في هذا المتجر. يرجى التواصل مع المتجر للتسجيل." 
          });
        }

        const customer = customerResult.rows[0];

        // Verify password matches
        if (!customer.password || customer.password !== password) {
          return res.status(403).json({ 
            error: "❌ كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى." 
          });
        }
        
        res.json({
          success: true,
          customer_id: customer.customer_id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          customer_type: customer.customer_type,
          credit_limit: customer.credit_limit,
          current_debt: customer.current_debt,
          message: "تم التحقق بنجاح ✓"
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get topup customers
    app.get("/api/topup/customers/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        
        const result = await pool.query(
          `SELECT id, store_id, name, phone, email, customer_type, credit_limit, starting_balance, is_active, created_at
           FROM customers 
           WHERE store_id = $1 AND is_active = true 
           ORDER BY created_at DESC`,
          [storeId]
        );
        
        // Calculate debt from orders for each customer
        const customersWithDebt = await Promise.all(
          result.rows.map(async (customer) => {
            // Search by customer_id first (accurate), then fallback to phone
            let debtResult = await pool.query(
              `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
               FROM orders
               WHERE store_id = $1 AND customer_id = $2`,
              [parseInt(storeId), customer.id]
            );
            let debtFromOrders = parseFloat(debtResult.rows[0]?.total_debt || 0);
            
            // Fallback to phone search if no results
            if (debtFromOrders === 0) {
              debtResult = await pool.query(
                `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
                 FROM orders
                 WHERE store_id = $1 AND phone = $2 AND is_topup_order = true`,
                [parseInt(storeId), customer.phone]
              );
              debtFromOrders = parseFloat(debtResult.rows[0]?.total_debt || 0);
            }
            
            // Get total payments for this customer
            const paymentsResult = await pool.query(
              `SELECT COALESCE(SUM(amount), 0) as total_payments
               FROM customer_payments
               WHERE store_id = $1 AND customer_id = $2`,
              [parseInt(storeId), customer.id]
            );
            const totalPayments = parseFloat(paymentsResult.rows[0]?.total_payments || 0);
            
            return {
              ...customer,
              current_debt: Math.max(0, parseFloat(customer.starting_balance || 0) + debtFromOrders - totalPayments)
            };
          })
        );
        
        res.json(customersWithDebt);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create topup customer
    app.post("/api/topup/customers", async (req, res) => {
      try {
        const { store_id, name, phone, email, password, customer_type, credit_limit, starting_balance } = req.body;
        
        if (!store_id || !name || !phone || !password) {
          return res.status(400).json({ error: "store_id, name, phone, and password are required" });
        }
        
        // Check if phone already exists
        const existingCheck = await pool.query(
          `SELECT id FROM customers WHERE store_id = $1 AND phone = $2`,
          [store_id, phone]
        );
        
        if (existingCheck.rows.length > 0) {
          return res.status(400).json({ error: "هذا رقم الهاتف مسجل بالفعل" });
        }
        
        const result = await pool.query(
          `INSERT INTO customers (store_id, name, phone, email, password, customer_type, credit_limit, current_debt, starting_balance, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, true)
           RETURNING id, store_id, name, phone, email, customer_type, credit_limit, current_debt, starting_balance`,
          [store_id, name, phone, email || '', password, customer_type || 'cash', credit_limit || 0, starting_balance || 0]
        );
        
        res.status(201).json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update topup customer
    app.put("/api/topup/customers/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email, password, customer_type, credit_limit, starting_balance } = req.body;
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (email !== undefined) {
          updates.push(`email = $${paramCount++}`);
          values.push(email);
        }
        if (password !== undefined) {
          updates.push(`password = $${paramCount++}`);
          values.push(password);
        }
        if (customer_type !== undefined) {
          updates.push(`customer_type = $${paramCount++}`);
          values.push(customer_type);
        }
        if (credit_limit !== undefined) {
          updates.push(`credit_limit = $${paramCount++}`);
          values.push(credit_limit);
        }
        if (starting_balance !== undefined) {
          updates.push(`starting_balance = $${paramCount++}`);
          values.push(starting_balance);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        const result = await pool.query(
          `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, phone, email, customer_type, credit_limit, current_debt, starting_balance`,
          values
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete topup customer
    app.delete("/api/topup/customers/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const customerId = parseInt(id, 10);
        
        if (isNaN(customerId)) {
          return res.status(400).json({ error: "Invalid customer ID" });
        }
        
        console.log(`🗑️ [DELETE TOPUP] Deleting customer: ${customerId}`);
        
        // Verify customer exists and get info
        const checkRes = await pool.query(
          `SELECT id, name, phone FROM customers WHERE id = $1`,
          [customerId]
        );
        
        if (checkRes.rows.length === 0) {
          console.error(`❌ Customer not found: ${customerId}`);
          return res.status(404).json({ error: "العميل غير موجود" });
        }
        
        const customer = checkRes.rows[0];
        
        // Permanently delete the customer
        const result = await pool.query(
          `DELETE FROM customers WHERE id = $1 RETURNING id`,
          [customerId]
        );
        
        console.log(`✅ [DELETE TOPUP] Customer deleted permanently: ${customer.name} (${customer.phone}) - ID: ${customerId}`);
        
        res.json({ success: true, message: "تم حذف العميل بنجاح", customer: { id: customerId, name: customer.name } });
      } catch (error) {
        console.error(`❌ [DELETE TOPUP] Error:`, error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get customer statement (transactions)
    app.get("/api/topup/customers/:customerId/statement", async (req, res) => {
      try {
        const { customerId } = req.params;
        
        // Get customer info
        const customerResult = await pool.query(
          `SELECT id, name, phone, email, customer_type, credit_limit, current_debt, starting_balance, created_at
           FROM customers WHERE id = $1`,
          [customerId]
        );
        
        if (customerResult.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }
        
        const customer = customerResult.rows[0];
        const openingBalance = Number(customer.starting_balance) || 0;
        
        // Get customer's topup orders (purchases/debits) from orders table
        const ordersResult = await pool.query(
          `SELECT 
            o.id, o.store_id, o.total_amount,
            o.status, o.created_at
           FROM orders o
           WHERE o.customer_id = $1 AND o.is_topup_order = true
           ORDER BY o.created_at ASC`,
          [customerId]
        );
        
        // Get customer's payments (credits)
        const paymentsResult = await pool.query(
          `SELECT id, customer_id, amount, payment_method, created_at
           FROM customer_payments WHERE customer_id = $1
           ORDER BY created_at ASC`,
          [customerId]
        );
        
        // Combine all transactions and build statement
        const allItems = [
          ...ordersResult.rows.map(o => ({
            id: o.id,
            created_at: o.created_at,
            type: 'topup',
            description: `شراء - ${o.total_amount || 0} د.ع`,
            amount: Number(o.total_amount || 0),
            is_payment: false,
            source: 'topup_order'
          })),
          ...paymentsResult.rows.map(p => ({
            id: p.id,
            created_at: p.created_at,
            type: 'payment',
            description: 'دفعة',
            amount: Number(p.amount || 0),
            is_payment: true,
            source: 'payment'
          }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // Calculate running balance (starting from opening balance)
        let runningBalance = openingBalance;
        const itemsWithBalance = allItems.map(item => {
          if (item.is_payment) {
            runningBalance -= item.amount;  // Payment reduces debt
          } else {
            runningBalance += item.amount;  // Purchase increases debt
          }
          return { ...item, balance: Math.max(0, runningBalance) };
        });
        
        // Add opening balance transaction
        const transactions = [
          {
            id: 0,
            created_at: customer.created_at,
            type: 'opening',
            description: 'ديون سابقة',
            amount: openingBalance,
            balance: openingBalance,
            is_payment: false,
            source: 'opening'
          },
          ...itemsWithBalance
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Calculate final current debt
        const finalBalance = itemsWithBalance.length > 0 
          ? itemsWithBalance[itemsWithBalance.length - 1].balance 
          : openingBalance;
        
        res.json({
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            customer_type: customer.customer_type,
            credit_limit: Number(customer.credit_limit),
            current_debt: finalBalance,
            starting_balance: openingBalance
          },
          transactions,
          current_debt: finalBalance
        });
      } catch (error) {
        console.error('❌ Statement error:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Topup Payment - Reduce starting_balance or current_debt
    app.post("/api/topup/payment", async (req, res) => {
      try {
        const { customer_id, store_id, amount } = req.body;
        
        if (!customer_id || !store_id || !amount || amount <= 0) {
          return res.status(400).json({ error: "customer_id, store_id, and amount are required" });
        }

        // Get customer info including starting_balance
        const customerResult = await pool.query(
          `SELECT id, customer_id, starting_balance, credit_limit FROM customers WHERE id = $1`,
          [customer_id]
        );

        if (customerResult.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customerResult.rows[0];
        const startingBalance = parseFloat(customer.starting_balance || 0);
        const totalDebt = startingBalance; // For now, we reduce from starting_balance
        
        if (amount > totalDebt) {
          return res.status(400).json({ error: `المبلغ المدخل أكبر من الديون الحالية (${totalDebt} د.ع)` });
        }

        // Reduce starting_balance
        const newStartingBalance = Math.max(0, startingBalance - amount);
        
        const updateResult = await pool.query(
          `UPDATE customers SET starting_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
          [newStartingBalance, customer_id]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: "Failed to update payment" });
        }

        // ✅ CRITICAL FIX: Insert payment record into customer_payments table
        // so it appears in the statement endpoint's transaction list
        try {
          await pool.query(
            `INSERT INTO customer_payments (customer_id, amount, payment_method, notes, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [customer_id, amount, 'online', 'تسديد ديون من خلال متجر الشحن']
          );
          console.log(`✅ [TOPUP PAYMENT] Payment recorded in customer_payments table`);
        } catch (dbErr) {
          console.warn(`⚠️ [TOPUP PAYMENT] Warning: Could not record payment in customer_payments:`, (dbErr as any).message);
          // Don't fail the API - the starting_balance was already updated
        }

        console.log(`💳 [TOPUP PAYMENT] Customer: ${customer_id} - Amount: ${amount} د.ع - New Balance: ${newStartingBalance} د.ع`);
        
        res.json({ 
          success: true, 
          message: "تم تسديد المبلغ بنجاح",
          customer: updateResult.rows[0],
          newDebt: newStartingBalance
        });
      } catch (error) {
        console.error("❌ Payment error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Check credit before purchase
    app.post("/api/customers/:customerId/check-credit", async (req, res) => {
      try {
        const { customerId } = req.params;
        const { amount } = req.body;
        
        const customerResult = await pool.query(
          `SELECT credit_limit, current_debt FROM customers WHERE id = $1`,
          [customerId]
        );
        
        if (customerResult.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }
        
        const customer = customerResult.rows[0];
        const availableCredit = customer.credit_limit - customer.current_debt;
        const canProceed = availableCredit >= amount;
        const isNearLimit = availableCredit < (customer.credit_limit * 0.2); // Alert at 20% remaining
        
        res.json({
          canProceed,
          isNearLimit,
          warning: isNearLimit ? `تحذير: الرصيد المتبقي ${availableCredit} د.ع` : '',
          availableCredit,
          creditLimit: customer.credit_limit,
          currentDebt: customer.current_debt
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get all topup orders
    app.get("/api/debug/orders-phone", async (req, res) => {
      try {
        const { phone, storeId } = req.query;
        console.log(`🔍 DEBUG QUERY: phone="${phone}" storeId="${storeId}"`);
        
        if (!phone) {
          return res.json({ error: "phone parameter required" });
        }
        
        let query = `SELECT id, phone, total_amount, store_id, is_topup_order FROM orders WHERE phone = $1`;
        let params: any[] = [phone];
        
        if (storeId && storeId !== "undefined") {
          query += ` AND store_id = $2`;
          params.push(parseInt(storeId as string));
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const result = await pool.query(query, params);
        
        console.log(`📊 DEBUG RESULT: Found ${result.rows.length} orders`);
        result.rows.forEach((row: any) => {
          console.log(`  - Order #${row.id}: phone="${row.phone}", amount=${row.total_amount}, store=${row.store_id}`);
        });
        
        res.json(result.rows);
      } catch (error) {
        console.error("Debug error:", error);
        res.json({ error: (error as any).message });
      }
    });

    app.get("/api/debug/debt-calculation", async (req, res) => {
      try {
        const { phone, storeId } = req.query;
        console.log(`\n🔍 DEBUG DEBT CALC: phone="${phone}" storeId="${storeId}"`);
        
        if (!phone || !storeId) {
          return res.json({ error: "phone and storeId required" });
        }
        
        // Step 1: Check if customer exists
        const custResult = await pool.query(
          `SELECT id, name, phone FROM customers WHERE phone = $1 AND store_id = $2`,
          [phone, parseInt(storeId as string)]
        );
        console.log(`📌 Customer found: ${custResult.rows.length > 0 ? JSON.stringify(custResult.rows[0]) : "NOT FOUND"}`);
        
        // Step 2: Calculate debt using exact query from endpoint
        const debtResult = await pool.query(
          `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
           FROM orders
           WHERE store_id = $1 AND phone = $2`,
          [parseInt(storeId as string), phone]
        );
        console.log(`💰 Debt query result: ${JSON.stringify(debtResult.rows[0])}`);
        
        // Step 3: Show all orders for this phone/store combo
        const ordersResult = await pool.query(
          `SELECT id, phone, total_amount, discount_amount, store_id FROM orders WHERE phone = $1 AND store_id = $2`,
          [phone, parseInt(storeId as string)]
        );
        console.log(`📦 Found ${ordersResult.rows.length} orders`);
        ordersResult.rows.forEach((row: any, idx: number) => {
          console.log(`   [${idx + 1}] ID: ${row.id}, Amount: ${row.total_amount}, Discount: ${row.discount_amount}`);
        });
        
        res.json({
          phone,
          storeId,
          customer: custResult.rows[0] || null,
          debtResult: debtResult.rows[0],
          orders: ordersResult.rows
        });
      } catch (error) {
        console.error("Debt calc debug error:", error);
        res.json({ error: (error as any).message });
      }
    });

    app.get("/api/topup/orders", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        let result;
        
        if (storeId) {
          // Get orders for specific topup store with company and product info
          result = await pool.query(
            `SELECT DISTINCT ON (o.id)
              o.id, 
              o.store_id, 
              o.customer_id,
              o.topup_customer_id,
              o.total_amount,
              o.status, 
              o.created_at, 
              o.phone,
              o.is_topup_order,
              tc.name AS company_name,
              tp.amount AS product_amount
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
            LEFT JOIN topup_companies tc ON tp.company_id = tc.id
            WHERE o.store_id = $1 AND o.is_topup_order = true
            ORDER BY o.id DESC
            LIMIT 500`,
            [parseInt(storeId)]
          );
        } else {
          // Get all topup orders from all stores with company and product info
          result = await pool.query(
            `SELECT DISTINCT ON (o.id)
              o.id, 
              o.store_id, 
              o.customer_id,
              o.topup_customer_id,
              o.total_amount,
              o.status, 
              o.created_at, 
              o.phone,
              o.is_topup_order,
              tc.name AS company_name,
              tp.amount AS product_amount
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
            LEFT JOIN topup_companies tc ON tp.company_id = tc.id
            WHERE o.is_topup_order = true
            ORDER BY o.id DESC
            LIMIT 500`
          );
        }
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    app.get("/api/topup/companies", async (req, res) => {
      try {
        // Default store ID is 21 (only topup store)
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 21;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT * FROM topup_companies WHERE store_id = $1 ORDER BY id`,
          [storeId]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    app.get("/api/topup/companies/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT * FROM topup_companies WHERE store_id = $1 ORDER BY id`,
          [storeId]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create topup company
    app.post("/api/topup/companies", async (req, res) => {
      try {
        const { store_id, name, logo_url } = req.body;
        
        if (!store_id || !name) {
          return res.status(400).json({ error: "store_id and name are required" });
        }
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `INSERT INTO topup_companies (store_id, name, logo_url) VALUES ($1, $2, $3) RETURNING *`,
          [store_id, name, logo_url || '']
        );
        
        res.status(201).json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update topup company
    app.put("/api/topup/companies/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name, logo_url } = req.body;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (logo_url !== undefined) {
          updates.push(`logo_url = $${paramCount++}`);
          values.push(logo_url);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        const query = `UPDATE topup_companies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Company not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete topup company
    app.delete("/api/topup/companies/:id", async (req, res) => {
      try {
        const { id } = req.params;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // Actually delete the company
        await pool.query(`DELETE FROM topup_companies WHERE id = $1`, [id]);
        res.json({ success: true, message: "✅ تم حذف الشركة بنجاح" });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get topup categories (default to store 21)
    app.get("/api/topup/categories", async (req, res) => {
      try {
        // Default store ID is 21 (only topup store)
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 21;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT * FROM topup_product_categories WHERE store_id = $1 ORDER BY id ASC`,
          [storeId]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    app.get("/api/topup/categories/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT * FROM topup_product_categories WHERE store_id = $1 ORDER BY id ASC`,
          [storeId]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create topup category
    app.post("/api/topup/categories", async (req, res) => {
      try {
        const { store_id, name } = req.body;
        
        if (!store_id || !name) {
          return res.status(400).json({ error: "store_id and name are required" });
        }
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `INSERT INTO topup_product_categories (store_id, name) VALUES ($1, $2) RETURNING *`,
          [store_id, name]
        );
        
        res.status(201).json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update topup category
    app.put("/api/topup/categories/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { name } = req.body;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `UPDATE topup_product_categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [name, id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete topup category
    app.delete("/api/topup/categories/:id", async (req, res) => {
      try {
        const { id } = req.params;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        await pool.query(`DELETE FROM topup_product_categories WHERE id = $1`, [id]);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get all topup products (default to store 21 - only topup store in system)
    app.get("/api/topup/products", async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        // Default store ID is 21 (only topup store)
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 21;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT 
            tp.id,
            tp.store_id,
            tp.company_id,
            tp.category_id,
            tp.amount,
            tp.price,
            tp.retail_price,
            tp.wholesale_price,
            tp.wholesale_price AS bulk_price,
            tp.available_codes,
            tp.images,
            tp.codes,
            tp.is_active,
            tc.name as company_name,
            tpc.name as category_name
          FROM topup_products tp
          LEFT JOIN topup_companies tc ON tp.company_id = tc.id
          LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
          WHERE tp.store_id = $1
          ORDER BY tp.created_at DESC
          LIMIT $2 OFFSET $3`,
          [storeId, limit, offset]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get topup products
    app.get("/api/topup/products/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT 
            tp.id,
            tp.store_id,
            tp.company_id,
            tp.category_id,
            tp.amount,
            tp.price,
            tp.retail_price,
            tp.wholesale_price,
            tp.wholesale_price AS bulk_price,
            tp.available_codes,
            tp.images,
            tp.codes,
            tp.is_active,
            tc.name as company_name,
            tpc.name as category_name
          FROM topup_products tp
          LEFT JOIN topup_companies tc ON tp.company_id = tc.id
          LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
          WHERE tp.store_id = $1
          ORDER BY tp.created_at DESC
          LIMIT $2 OFFSET $3`,
          [storeId, limit, offset]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create topup product
    app.post("/api/topup/products", async (req, res) => {
      try {
        const { store_id, company_id, amount, price, bulk_price, quantity_type, category_id } = req.body;
        
        console.log('📦 Product POST received:', { store_id, company_id, amount, price });
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        if (!store_id) {
          return res.status(400).json({ error: "Missing store_id" });
        }
        if (!company_id) {
          return res.status(400).json({ error: "Missing company_id" });
        }
        if (!amount) {
          return res.status(400).json({ error: "Missing amount" });
        }
        if (!price) {
          return res.status(400).json({ error: "Missing price" });
        }
        
        // Ensure default category exists
        const checkCat = await pool.query(
          `SELECT id FROM topup_product_categories WHERE store_id = $1 AND name = 'عام' LIMIT 1`,
          [store_id]
        );
        
        let finalCategoryId = category_id;
        
        if (!finalCategoryId) {
          if (checkCat.rows.length > 0) {
            finalCategoryId = checkCat.rows[0].id;
            console.log('✅ Using existing default category:', finalCategoryId);
          } else {
            // Create default category if it doesn't exist
            const newCat = await pool.query(
              `INSERT INTO topup_product_categories (store_id, name) VALUES ($1, $2) RETURNING id`,
              [store_id, 'عام']
            );
            finalCategoryId = newCat.rows[0].id;
            console.log('✅ Created new default category:', finalCategoryId);
          }
        }
        
        const result = await pool.query(
          `INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [store_id, company_id, finalCategoryId, amount, price, bulk_price || price, bulk_price || price]
        );
        
        console.log('✅ Product created:', result.rows[0]);
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({ error: (error as any).message, details: (error as any).detail });
      }
    });

    // Update topup product
    app.put("/api/topup/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, price, bulk_price, retail_price, wholesale_price, available_codes } = req.body;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (amount !== undefined) {
          updates.push(`amount = $${paramCount++}`);
          values.push(amount);
        }
        if (price !== undefined) {
          updates.push(`price = $${paramCount++}`);
          values.push(price);
        }
        if (bulk_price !== undefined) {
          updates.push(`retail_price = $${paramCount++}`);
          updates.push(`wholesale_price = $${paramCount++}`);
          values.push(bulk_price);
          values.push(bulk_price);
        } else if (retail_price !== undefined || wholesale_price !== undefined) {
          if (retail_price !== undefined) {
            updates.push(`retail_price = $${paramCount++}`);
            values.push(retail_price);
          }
          if (wholesale_price !== undefined) {
            updates.push(`wholesale_price = $${paramCount++}`);
            values.push(wholesale_price);
          }
        }
        if (available_codes !== undefined) {
          updates.push(`available_codes = $${paramCount++}`);
          values.push(available_codes);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        const query = `UPDATE topup_products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete topup product
    app.delete("/api/topup/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        
        // منع التخزين المؤقت
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        const result = await pool.query(
          `DELETE FROM topup_products WHERE id = $1 RETURNING id`,
          [parseInt(id)]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: "Product not found" });
        }
        
        res.json({ success: true, message: "Product deleted successfully", product: result.rows[0] });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as any).message });
      }
    });

    // Upload images to topup product (card images with codes printed on them)
    app.post("/api/topup/upload-images", async (req, res) => {
      try {
        console.log('📤 Starting image upload request...');
        const { store_id, topup_product_id, images } = req.body;

        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (!store_id || !topup_product_id || !images || !Array.isArray(images)) {
          console.warn('⚠️ Missing required fields');
          return res.status(400).json({ error: "Missing required fields or invalid images format" });
        }

        console.log('📊 Image upload details:', { store_id, topup_product_id, image_count: images.length });

        // Filter out empty images
        const validImages = images.filter((img: string) => img && img.trim()).map((img: string) => img.trim());

        if (validImages.length === 0) {
          console.warn('⚠️ No valid images provided');
          return res.status(400).json({ error: "No valid images provided" });
        }

        console.log('✔️ Valid images count:', validImages.length);

        // Get existing images
        const existingResult = await pool.query(
          `SELECT images FROM topup_products WHERE id = $1 AND store_id = $2`,
          [topup_product_id, store_id]
        );

        if (existingResult.rows.length === 0) {
          console.warn('⚠️ Product not found');
          return res.status(404).json({ error: "Product not found" });
        }

        const existingImages = existingResult.rows[0].images || [];
        
        // Create a set of existing images for fast lookup
        const existingImagesSet = new Set(existingImages);
        
        // Filter new images to only include those that don't already exist
        const newUniqueImages = validImages.filter((img: string) => !existingImagesSet.has(img));
        
        // Count duplicates
        const duplicateCount = validImages.length - newUniqueImages.length;

        // Merge old and new unique images only
        const allImages = [...existingImages, ...newUniqueImages];

        console.log('💾 Updating product with images...');

        // Update product with new images only - don't modify available_codes
        const result = await pool.query(
          `UPDATE topup_products 
           SET images = $1
           WHERE id = $2 AND store_id = $3 
           RETURNING id, images`,
          [allImages, topup_product_id, store_id]
        );

        let message = `تم تحميل ${newUniqueImages.length} صورة جديدة بنجاح`;
        if (duplicateCount > 0) {
          message += ` (تم تخطي ${duplicateCount} صور مكررة)`;
        }

        console.log('✅ Images uploaded successfully:', { product_id: topup_product_id, new_count: newUniqueImages.length, duplicate_count: duplicateCount });
        res.json({ success: true, message, product: result.rows[0] });
      } catch (error) {
        console.error('❌ Error uploading images:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Upload codes to topup product
    app.post("/api/topup/upload-codes", async (req, res) => {
      try {
        const { store_id, topup_product_id, codes } = req.body;

        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (!store_id || !topup_product_id || !codes || !Array.isArray(codes)) {
          return res.status(400).json({ error: "Missing required fields or invalid codes format" });
        }

        // Filter out empty codes
        const validCodes = codes.filter((code: string) => code.trim()).map((code: string) => code.trim());

        if (validCodes.length === 0) {
          return res.status(400).json({ error: "No valid codes provided" });
        }

        // Get existing codes
        const existingResult = await pool.query(
          `SELECT codes FROM topup_products WHERE id = $1 AND store_id = $2`,
          [topup_product_id, store_id]
        );

        if (existingResult.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        const existingCodes = existingResult.rows[0].codes || [];
        
        // Create a set of existing codes for fast lookup
        const existingCodesSet = new Set(existingCodes);
        
        // Filter new codes to only include those that don't already exist
        const newUniqueCode = validCodes.filter((code: string) => !existingCodesSet.has(code));
        
        // Count duplicates
        const duplicateCount = validCodes.length - newUniqueCode.length;

        // Merge old and new unique codes only
        const allCodes = [...existingCodes, ...newUniqueCode];

        // Update product with new codes and available_codes count
        const result = await pool.query(
          `UPDATE topup_products 
           SET codes = $1, available_codes = $2 
           WHERE id = $3 AND store_id = $4 
           RETURNING id, available_codes`,
          [allCodes, allCodes.length, topup_product_id, store_id]
        );

        let message = `تم تحميل ${newUniqueCode.length} أكواد جديدة بنجاح`;
        if (duplicateCount > 0) {
          message += ` (تم تخطي ${duplicateCount} أكواد مكررة)`;
        }

        console.log('✅ Codes uploaded:', { product_id: topup_product_id, new_count: newUniqueCode.length, duplicate_count: duplicateCount });
        res.json({ success: true, message, product: result.rows[0] });
      } catch (error) {
        console.error('❌ Error uploading codes:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Topup Purchase
    app.post("/api/topup/purchase", async (req, res) => {
      try {
        const { store_id, topup_product_id, quantity, customer_id, customer_type, phone, total_amount } = req.body;

        console.log(`\n🛒 ========== TOPUP PURCHASE REQUEST ==========`);
        console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));

        if (!store_id || !topup_product_id || !quantity || !phone) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert store_id from string to integer
        const parsedStoreId = parseInt(store_id, 10);
        if (isNaN(parsedStoreId)) {
          return res.status(400).json({ error: "Invalid store_id format" });
        }

        console.log(`\n🔍 Finding or creating customer...`);
        console.log(`  - customer_id provided: ${customer_id}`);
        console.log(`  - phone provided: ${phone}`);
        console.log(`  - store_id: ${parsedStoreId}`);

        // Helper function to get or create customer
        let foundCustomerId: number | null = null;
        
        // Step 1: If customer_id provided, verify it exists
        if (customer_id) {
          const checkRes = await pool.query(
            `SELECT id FROM customers WHERE id = $1 AND store_id = $2`,
            [customer_id, parsedStoreId]
          );
          
          if (checkRes.rows.length > 0) {
            foundCustomerId = customer_id;
            console.log(`✅ Customer found by ID: ${foundCustomerId}`);
          } else {
            console.error(`❌ Customer ID ${customer_id} not found for store ${parsedStoreId}`);
            return res.status(403).json({ error: "❌ العميل غير مسجل" });
          }
        }
        
        // Step 2: If no customer_id, try to find or create by phone
        if (!foundCustomerId && phone) {
          console.log(`🔍 Searching for customer by phone: ${phone}`);
          
          const phoneRes = await pool.query(
            `SELECT id FROM customers WHERE phone = $1 AND store_id = $2`,
            [phone, parsedStoreId]
          );
          
          if (phoneRes.rows.length > 0) {
            foundCustomerId = phoneRes.rows[0].id;
            console.log(`✅ Customer found by phone: ID=${foundCustomerId}`);
          } else {
            // Create new customer
            console.log(`✨ Creating new customer...`);
            try {
              const insertRes = await pool.query(
                `INSERT INTO customers (store_id, phone, name, customer_type, credit_limit, current_debt, is_active)
                 VALUES ($1, $2, $3, $4, 50000, 0, true)
                 RETURNING id`,
                [parsedStoreId, phone, `عميل جديد - ${phone}`, customer_type || 'cash']
              );
              
              foundCustomerId = insertRes.rows[0].id;
              console.log(`✅ New customer created: ID=${foundCustomerId}`);
            } catch (insertErr: any) {
              console.error(`❌ Insert error:`, insertErr.code, insertErr.message);
              
              // If unique constraint violation, customer might be deleted, try to reactivate
              if (insertErr.code === '23505') {
                console.log(`⚠️ Unique constraint - customer exists, fetching...`);
                const existRes = await pool.query(
                  `SELECT id, is_active FROM customers WHERE phone = $1 AND store_id = $2`,
                  [phone, parsedStoreId]
                );
                
                if (existRes.rows.length > 0) {
                  foundCustomerId = existRes.rows[0].id;
                  
                  if (!existRes.rows[0].is_active) {
                    console.log(`🔄 Reactivating customer ID=${foundCustomerId}`);
                    await pool.query(
                      `UPDATE customers SET is_active = true WHERE id = $1`,
                      [foundCustomerId]
                    );
                  }
                  
                  console.log(`✅ Using customer: ID=${foundCustomerId}`);
                } else {
                  console.error(`❌ Constraint violation but customer not found`);
                  return res.status(500).json({ error: "❌ خطأ في البيانات" });
                }
              } else {
                return res.status(500).json({ error: `❌ خطأ: ${insertErr.message}` });
              }
            }
          }
        }
        
        // Step 3: Verify we have a valid customer ID
        if (!foundCustomerId || typeof foundCustomerId !== 'number') {
          console.error(`❌ CRITICAL: Invalid foundCustomerId=${foundCustomerId}`);
          return res.status(400).json({ error: "❌ فشل التحقق من العميل" });
        }

        console.log(`✅ Customer verified: ID=${foundCustomerId}`);

        // Step 4: Check credit and debt BEFORE updating
        console.log(`\n💰 Checking credit limits...`);
        
        const creditRes = await pool.query(
          `SELECT credit_limit FROM customers WHERE id = $1`,
          [foundCustomerId]
        );
        
        if (creditRes.rows.length === 0) {
          console.error(`❌ CRITICAL: Customer ${foundCustomerId} disappeared!`);
          return res.status(500).json({ error: "❌ خطأ في البيانات" });
        }
        
        const creditLimit = creditRes.rows[0].credit_limit;
        
        // Calculate actual debt from all orders (NOT from current_debt field)
        const debtRes = await pool.query(
          `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
           FROM orders
           WHERE topup_customer_id = $1`,
          [foundCustomerId]
        );
        
        const actualDebt = parseFloat(debtRes.rows[0].total_debt || 0);
        const availableCredit = creditLimit - actualDebt;
        
        console.log(`  - Credit Limit: ${creditLimit}`);
        console.log(`  - Actual Debt (from orders): ${actualDebt}`);
        console.log(`  - Available: ${availableCredit}`);
        console.log(`  - Purchase Amount: ${total_amount}`);
        
        if (availableCredit < total_amount) {
          return res.status(403).json({ 
            error: `❌ الرصيد المتاح ${availableCredit} أقل من المبلغ المطلوب ${total_amount}` 
          });
        }

        // Step 5: Final safety check before INSERT
        console.log(`\n🔐 Final safety checks...`);
        console.log(`  - foundCustomerId: ${foundCustomerId} (${typeof foundCustomerId})`);
        console.log(`  - store_id: ${parsedStoreId} (${typeof parsedStoreId})`);
        console.log(`  - total_amount: ${total_amount}`);

        if (!foundCustomerId || typeof foundCustomerId !== 'number' || foundCustomerId <= 0) {
          console.error(`❌ CRITICAL: foundCustomerId is invalid!`);
          return res.status(400).json({ error: "❌ معرف العميل غير صحيح" });
        }

        if (!parsedStoreId || typeof parsedStoreId !== 'number' || parsedStoreId <= 0) {
          console.error(`❌ CRITICAL: parsedStoreId is invalid!`);
          return res.status(400).json({ error: "❌ معرف المتجر غير صحيح" });
        }

        // Double-check customer still exists
        const finalCheckRes = await pool.query(
          `SELECT id FROM customers WHERE id = $1 AND store_id = $2`,
          [foundCustomerId, parsedStoreId]
        );

        if (finalCheckRes.rows.length === 0) {
          console.error(`❌ CRITICAL: Customer ${foundCustomerId} not found for store ${parsedStoreId}`);
          return res.status(500).json({ error: "❌ العميل غير موجود" });
        }

        console.log(`✅ All checks passed - ready to create order`);
        
        const orderResult = await pool.query(
          `INSERT INTO orders (customer_id, topup_customer_id, store_id, total_amount, phone, address, status, is_topup_order)
           VALUES ($1, $2, $3, $4, $5, 'Topup Order', 'completed', true)
           RETURNING id`,
          [null, foundCustomerId, parsedStoreId, total_amount, phone]
        );

        if (!orderResult.rows || orderResult.rows.length === 0) {
          console.error(`❌ Failed to create order - no rows returned`);
          return res.status(500).json({ error: "❌ فشل إنشاء الطلب" });
        }

        const orderId = orderResult.rows[0].id;
        console.log(`✅ Topup Order Created: ID=${orderId}, Customer=${foundCustomerId}, Store=${parsedStoreId}, Amount=${total_amount}`);

        // Add order item with topup_product_id
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, topup_product_id, quantity, price)
           VALUES ($1, NULL, $2, $3, $4)`,
          [orderId, topup_product_id, quantity, total_amount / quantity]
        );

        console.log(`✅ Order item added for topup product ${topup_product_id}`);

        // Get current product codes/images and remove used ones
        const productResult = await pool.query(
          `SELECT codes, images FROM topup_products WHERE id = $1`,
          [topup_product_id]
        );

        if (productResult.rows.length > 0) {
          const product = productResult.rows[0];
          let codesArray = product.codes;
          let imagesArray = product.images || [];
          
          // PostgreSQL TEXT[] returns as array, but handle edge cases
          if (typeof codesArray === 'string') {
            try {
              codesArray = JSON.parse(codesArray);
            } catch (e) {
              codesArray = [];
            }
          }
          
          if (typeof imagesArray === 'string') {
            try {
              imagesArray = JSON.parse(imagesArray);
            } catch (e) {
              imagesArray = [];
            }
          }
          
          // Ensure it's an array
          if (!Array.isArray(codesArray)) {
            codesArray = [];
          }
          if (!Array.isArray(imagesArray)) {
            imagesArray = [];
          }
          
          console.log(`🔑 Current codes available: ${codesArray.length}`);
          console.log(`🖼️  Current images available: ${imagesArray.length}`);
          
          if (codesArray.length > 0) {
            // Remove the first 'quantity' codes from the product
            const remainingCodes = codesArray.slice(quantity);
            console.log(`🗑️  Removed ${quantity} codes. Remaining: ${remainingCodes.length}`);
            
            // Update product with remaining codes AND update available_codes count
            await pool.query(
              `UPDATE topup_products SET codes = $1, available_codes = $2 WHERE id = $3`,
              [remainingCodes, remainingCodes.length, topup_product_id]
            );
            
            console.log(`✅ Topup product codes updated - available_codes: ${remainingCodes.length}`);
          } else {
            console.log(`⚠️  Warning: No codes available to assign!`);
          }
          
          // Handle images - store them in order_images table
          if (imagesArray.length > 0) {
            // Use the first 'quantity' images for this order
            const usedImages = imagesArray.slice(0, quantity);
            const remainingImages = imagesArray.slice(quantity);
            
            console.log(`🖼️  Assigning ${usedImages.length} images to order. Remaining images: ${remainingImages.length}`);
            
            // Store used images in order_images table
            for (const image of usedImages) {
              try {
                await pool.query(
                  `INSERT INTO order_images (order_id, topup_product_id, image_url)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (order_id, topup_product_id, image_url) DO NOTHING`,
                  [orderId, topup_product_id, image]
                );
              } catch (err) {
                console.error(`⚠️  Error storing image: ${err}`);
              }
            }
            
            // Update product with remaining images
            await pool.query(
              `UPDATE topup_products SET images = $1 WHERE id = $2`,
              [remainingImages, topup_product_id]
            );
            
            console.log(`✅ Topup product images updated - remaining: ${remainingImages.length}`);
          }
        }

        // NOTE: Do NOT update current_debt or record transaction here!
        // Debt is calculated dynamically from orders table in statement endpoint
        // This prevents double-counting

        console.log(`\n✅ ========== TOPUP PURCHASE COMPLETED SUCCESSFULLY ==========\n`);
        res.json({ success: true, order_id: orderId, message: "✓ تم إتمام الشراء بنجاح" });
      } catch (error) {
        console.error(`\n❌ ========== TOPUP PURCHASE FAILED ==========`);
        console.error(`Error details:`, (error as any).message);
        console.error(`Stack:`, (error as any).stack);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get order images (card photos) after purchase
    app.get("/api/topup/order-images/:orderId", async (req, res) => {
      try {
        const { orderId } = req.params;

        // جلب صور الطلب من جدول order_images
        const imagesResult = await pool.query(
          `SELECT oi.image_url, oi.image_data, oi.topup_product_id, tp.amount, tp.price
           FROM order_images oi
           JOIN topup_products tp ON oi.topup_product_id = tp.id
           WHERE oi.order_id = $1
           ORDER BY oi.created_at ASC`,
          [orderId]
        );

        if (imagesResult.rows.length === 0) {
          return res.status(404).json({ error: "No images found for this order", images: [] });
        }

        const images = imagesResult.rows.map(row => ({
          image_url: row.image_url,
          image_data: row.image_data,
          product_id: row.topup_product_id,
          amount: row.amount,
          price: row.price
        }));

        res.json({
          order_id: orderId,
          images: images,
          count: images.length
        });
      } catch (error) {
        console.error('❌ Error fetching order images:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get order codes after purchase (legacy - still supported)
    app.get("/api/topup/order-codes/:orderId", async (req, res) => {
      try {
        const { orderId } = req.params;

        // جلب بيانات الطلب
        const orderResult = await pool.query(
          `SELECT id, store_id, status FROM orders WHERE id = $1`,
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          return res.status(404).json({ error: "Topup order not found" });
        }

        const order = orderResult.rows[0];

        // جلب المنتجات المطلوبة في الطلب من جدول order_items
        const itemsResult = await pool.query(
          `SELECT topup_product_id, quantity FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        if (itemsResult.rows.length === 0) {
          return res.status(400).json({ error: "No items found for this order", codes: [] });
        }

        // جلب الأكواد لكل منتج في الطلب
        let allCodes: string[] = [];
        for (const item of itemsResult.rows) {
          const productResult = await pool.query(
            `SELECT codes FROM topup_products WHERE id = $1`,
            [item.topup_product_id]
          );

          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            if (product.codes && Array.isArray(product.codes)) {
              // خذ أول X أكواد حسب الكمية المطلوبة
              const codesToAdd = product.codes.slice(0, item.quantity);
              allCodes = [...allCodes, ...codesToAdd];
            }
          }
        }

        res.json({
          order_id: orderId,
          store_id: order.store_id,
          status: order.status,
          codes: allCodes,
          count: allCodes.length
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete topup order (for returned orders)
    app.delete("/api/topup/orders/:orderId", async (req, res) => {
      try {
        const { orderId } = req.params;

        console.log(`🗑️  Attempting to delete topup order: ${orderId}`);

        // Get order details before deleting
        const orderResult = await pool.query(
          `SELECT id, store_id, status FROM orders WHERE id = $1 AND is_topup_order = true`,
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          return res.status(404).json({ error: "Topup order not found" });
        }

        const order = orderResult.rows[0];

        // Get order items to restore codes if needed
        const itemsResult = await pool.query(
          `SELECT topup_product_id, quantity FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        // Delete order items
        await pool.query(
          `DELETE FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        // Get order details before deletion to update customer debt
        const orderDetailsRes = await pool.query(
          `SELECT customer_id, total_amount, discount_amount FROM orders WHERE id = $1`,
          [orderId]
        );

        if (orderDetailsRes.rows.length > 0) {
          const order = orderDetailsRes.rows[0];
          const orderAmount = order.total_amount - (order.discount_amount || 0);

          // Update customer debt (reduce by order amount)
          if (order.customer_id) {
            const debtUpdateRes = await pool.query(
              `UPDATE customers SET current_debt = GREATEST(0, current_debt - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING current_debt`,
              [orderAmount, order.customer_id]
            );
            console.log(`💳 [TOPUP ORDER DELETE] Customer ${order.customer_id} debt reduced by ${orderAmount}. New debt: ${debtUpdateRes.rows[0]?.current_debt || 0}`);
          }
        }

        // Delete the order
        const deleteResult = await pool.query(
          `DELETE FROM orders WHERE id = $1 RETURNING id`,
          [orderId]
        );

        if (deleteResult.rows.length === 0) {
          return res.status(500).json({ error: "Failed to delete order" });
        }

        console.log(`✅ Topup order deleted successfully: ${orderId}`);

        res.json({
          success: true,
          message: "تم حذف طلب الشحن بنجاح",
          deleted_order_id: orderId
        });
      } catch (error) {
        console.error("Error deleting topup order:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // ========== AUCTION ENDPOINTS ==========

    // GET all active auctions
    app.get("/api/auctions/active", async (req, res) => {
      try {
        // Update auctions that have ended
        await pool.query(`
          UPDATE auctions 
          SET status = 'completed' 
          WHERE status = 'active' 
          AND (auction_date::timestamp + auction_end_time::time) <= NOW()
        `);

        const result = await pool.query(`
          SELECT 
            a.*,
            p.name as product_name,
            p.image_url,
            p.store_id,
            s.store_name,
            COALESCE(a.current_highest_price, a.starting_price) as highest_bid,
            (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as total_bids
          FROM auctions a
          JOIN products p ON a.product_id = p.id
          JOIN stores s ON a.store_id = s.id
          WHERE a.status IN ('active', 'completed')
          ORDER BY a.auction_end_time ASC
        `);
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // GET auction details
    app.get("/api/auctions/:id", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);
        
        const auctionResult = await pool.query(`
          SELECT 
            a.*,
            p.name as product_name,
            p.image_url,
            p.description,
            s.store_name
          FROM auctions a
          JOIN products p ON a.product_id = p.id
          JOIN stores s ON a.store_id = s.id
          WHERE a.id = $1
        `, [auctionId]);

        if (auctionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auction not found' });
        }

        const bidsResult = await pool.query(`
          SELECT 
            ab.*,
            u.name as customer_name
          FROM auction_bids ab
          JOIN users u ON ab.customer_id = u.id
          WHERE ab.auction_id = $1
          ORDER BY ab.bid_price DESC, ab.bid_time ASC
        `, [auctionId]);

        res.json({
          auction: auctionResult.rows[0],
          bids: bidsResult.rows
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // POST create new auction
    app.post("/api/auctions", async (req, res) => {
      try {
        const { product_id, auction_date, auction_start_time, auction_end_time, starting_price } = req.body;

        // Validate inputs
        if (!product_id || !auction_date || !auction_start_time || !auction_end_time || !starting_price) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (starting_price <= 0) {
          return res.status(400).json({ error: 'Starting price must be greater than 0' });
        }

        // Get product and verify it exists
        const productResult = await pool.query(`
          SELECT store_id FROM products WHERE id = $1
        `, [product_id]);

        if (productResult.rows.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        const store_id = productResult.rows[0].store_id;

        // Create auction
        const result = await pool.query(`
          INSERT INTO auctions (product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price, current_highest_price, status)
          VALUES ($1, $2, $3, $4, $5, $6, $6, 'active')
          RETURNING *
        `, [product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price]);

        // Update product to mark as auction
        await pool.query(`
          UPDATE products
          SET is_auction = true, auction_id = $1
          WHERE id = $2
        `, [result.rows[0].id, product_id]);

        res.status(201).json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // POST place a bid
    app.post("/api/auctions/:id/bid", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);
        const { customer_id, bid_price, customer_name, customer_phone } = req.body;

        // Allow customer_id to be null for anonymous bids
        if (!bid_price || !customer_name || !customer_phone) {
          return res.status(400).json({ error: 'Missing required fields: bid_price, customer_name, customer_phone' });
        }

        // Get current auction
        const auctionResult = await pool.query(`
          SELECT * FROM auctions WHERE id = $1
        `, [auctionId]);

        if (auctionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auction not found' });
        }

        const auction = auctionResult.rows[0];

        // Check if auction has ended
        const today = new Date().toISOString().split('T')[0];
        const [hours, minutes] = auction.auction_end_time.split(':');
        
        let endDateTime = new Date(auction.auction_date);
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const now = new Date();
        
        if (now.getTime() > endDateTime.getTime()) {
          return res.status(400).json({ error: 'Auction has ended, cannot accept new bids' });
        }

        // Validate bid against current highest or starting price
        const minBidPrice = auction.current_highest_price || auction.starting_price;
        if (parseFloat(bid_price) <= parseFloat(minBidPrice)) {
          return res.status(400).json({ error: `Bid must be higher than ${minBidPrice}` });
        }

        // Place bid (customer_id can be null for anonymous bids)
        const bidResult = await pool.query(`
          INSERT INTO auction_bids (auction_id, customer_id, bid_price, customer_name, customer_phone)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [auctionId, customer_id || null, bid_price, customer_name, customer_phone]);

        // Update auction's highest price
        await pool.query(`
          UPDATE auctions
          SET current_highest_price = $1, winner_id = $2
          WHERE id = $3
        `, [bid_price, customer_id, auctionId]);

        res.status(201).json(bidResult.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // DELETE auction (for merchant only)
    app.delete("/api/auctions/:id", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);

        // Get auction
        const auctionResult = await pool.query(`
          SELECT * FROM auctions WHERE id = $1
        `, [auctionId]);

        if (auctionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auction not found' });
        }

        const auction = auctionResult.rows[0];

        // Only allow deletion if auction is completed OR no bids placed
        const bidsResult = await pool.query(`
          SELECT COUNT(*) FROM auction_bids WHERE auction_id = $1
        `, [auctionId]);

        const bidCount = parseInt(bidsResult.rows[0].count);
        if (auction.status !== 'completed' && bidCount > 0) {
          return res.status(400).json({ error: 'Cannot delete active auction with existing bids' });
        }

        // Delete auction bids first (if needed)
        await pool.query(`
          DELETE FROM auction_bids WHERE auction_id = $1
        `, [auctionId]);

        // Delete auction
        await pool.query(`
          DELETE FROM auctions WHERE id = $1
        `, [auctionId]);

        // Revert product
        await pool.query(`
          UPDATE products
          SET is_auction = false, auction_id = NULL
          WHERE auction_id = $1
        `, [auctionId]);

        res.json({ message: 'Auction deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // GET all bidders for a specific auction (for merchant)
    app.get("/api/auctions/:id/bidders", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);

        const result = await pool.query(`
          SELECT 
            ab.id,
            ab.customer_name,
            ab.customer_phone,
            ab.bid_price,
            ab.bid_time,
            ROW_NUMBER() OVER (ORDER BY ab.bid_price DESC) as position
          FROM auction_bids ab
          WHERE ab.auction_id = $1
          ORDER BY ab.bid_price DESC, ab.bid_time DESC
        `, [auctionId]);

        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ========== END AUCTION ENDPOINTS ==========

    // Test Endpoint
    app.get("/api/test", (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Database Restore Endpoint (Admin Only)
    app.post("/api/admin/restore-database", async (req, res) => {
      try {
        const { authToken } = req.body;
        
        // Simple auth check (should be the admin password or token)
        if (authToken !== 'admin-restore-key-2024') {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        const { sql } = req.body;
        if (!sql || typeof sql !== 'string') {
          return res.status(400).json({ error: 'SQL content required' });
        }

        console.log('🔄 Starting database restore...');
        
        const client = await pool.connect();
        
        // Split SQL into statements and execute
        const statements = sql.split(';').filter(s => s.trim());
        let executed = 0;
        let errors = [];
        
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (!trimmed || trimmed.startsWith('--')) continue;
          
          try {
            await client.query(trimmed);
            executed++;
          } catch (error) {
            console.error(`Error executing statement: ${error.message}`);
            errors.push(error.message);
          }
        }
        
        client.release();
        
        console.log(`✅ Database restore completed: ${executed} statements executed`);
        res.json({ 
          success: true, 
          executed,
          errors: errors.length > 0 ? errors : undefined,
          message: `Restored database with ${executed} statements`
        });
        
      } catch (error) {
        console.error('Database restore error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Serve static files from dist with fallback to index.html for SPA routing
    const distPath = path.join(__dirname, "dist");
    
    // Serve assets with caching
    app.use('/assets', express.static(path.join(distPath, "assets"), {
      maxAge: '1y',
      etag: false
    }));
    
    // Serve other static files
    app.use(express.static(distPath, {
      extensions: ['html', 'js', 'css', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'woff', 'woff2'],
      index: false // Disable automatic index.html handling
    }));

    // Customer Payments APIs
    // Get all payments for a customer
    app.get("/api/customer-payments/:storeId/:customerId", async (req, res) => {
      try {
        const { storeId, customerId } = req.params;
        
        const result = await pool.query(
          `SELECT id, customer_id, store_id, amount, payment_method, notes, created_at, updated_at
           FROM customer_payments
           WHERE store_id = $1 AND customer_id = $2
           ORDER BY created_at DESC`,
          [parseInt(storeId), parseInt(customerId)]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Add payment
    app.post("/api/customer-payments", async (req, res) => {
      try {
        const { customer_id, store_id, amount, payment_method, notes } = req.body;
        
        console.log('📝 Payment request received:', { customer_id, store_id, amount, payment_method, notes });
        
        // Detailed validation
        if (!customer_id) {
          console.warn('❌ Validation failed: customer_id is required');
          return res.status(400).json({ error: "customer_id is required" });
        }
        if (!store_id) {
          console.warn('❌ Validation failed: store_id is required');
          return res.status(400).json({ error: "store_id is required" });
        }
        if (!amount || isNaN(amount) || amount <= 0) {
          console.warn('❌ Validation failed: amount must be a valid number > 0, received:', amount);
          return res.status(400).json({ error: "amount must be a valid number greater than 0" });
        }

        // Decrease current_debt by payment amount (payment reduces what customer owes)
        await pool.query(
          `UPDATE customers SET current_debt = current_debt - $1 WHERE id = $2`,
          [amount, customer_id]
        );

        // Add payment record
        const paymentResult = await pool.query(
          `INSERT INTO customer_payments (customer_id, store_id, amount, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [customer_id, store_id, amount, payment_method || null, notes || null]
        );

        console.log(`✅ [PAYMENT ADDED] Customer: ${customer_id} - Store: ${store_id} - Amount: ${amount} | Debt decreased by ${amount} ✓`);
        res.json(paymentResult.rows[0]);
      } catch (error) {
        const errorMsg = (error as any).message || 'Unknown error';
        console.error('❌ [PAYMENT ERROR]', errorMsg, (error as any));
        res.status(500).json({ error: `Database error: ${errorMsg}` });
      }
    });

    // Update payment
    app.put("/api/customer-payments/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { amount, payment_method, notes } = req.body;

        // Get the current payment details to calculate the difference
        const currentPaymentRes = await pool.query(
          `SELECT id, customer_id, amount FROM customer_payments WHERE id = $1`,
          [parseInt(id)]
        );

        if (currentPaymentRes.rows.length === 0) {
          return res.status(404).json({ error: "Payment not found" });
        }

        const currentPayment = currentPaymentRes.rows[0];
        const oldAmount = currentPayment.amount;
        const newAmount = amount || oldAmount;
        const amountDifference = oldAmount - newAmount;

        // Update current_debt based on the difference
        // If newAmount > oldAmount: customer paid more → debt decreases more (subtract difference)
        // If newAmount < oldAmount: customer paid less → debt increases (add difference)
        if (amountDifference !== 0) {
          await pool.query(
            `UPDATE customers SET current_debt = current_debt + $1 WHERE id = $2`,
            [amountDifference, currentPayment.customer_id]
          );
        }

        // Update the payment record
        const result = await pool.query(
          `UPDATE customer_payments 
           SET amount = COALESCE($1, amount),
               payment_method = COALESCE($2, payment_method),
               notes = COALESCE($3, notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [amount || null, payment_method || null, notes || null, parseInt(id)]
        );

        console.log(`✏️ [PAYMENT UPDATED] ID: ${id} | Old: ${oldAmount} → New: ${newAmount} | Debt adjusted by: ${amountDifference} ✓`);
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete payment
    app.delete("/api/customer-payments/:id", async (req, res) => {
      try {
        const { id } = req.params;

        // Get the payment details before deleting
        const paymentRes = await pool.query(
          `SELECT id, customer_id, amount FROM customer_payments WHERE id = $1`,
          [parseInt(id)]
        );

        if (paymentRes.rows.length === 0) {
          return res.status(404).json({ error: "Payment not found" });
        }

        const payment = paymentRes.rows[0];
        const { customer_id, amount } = payment;

        // When a payment is deleted, add the payment amount back to current_debt
        // because the customer still owes what they were trying to pay
        await pool.query(
          `UPDATE customers SET current_debt = current_debt + $1 WHERE id = $2`,
          [amount, customer_id]
        );

        // Delete the payment record
        await pool.query(
          `DELETE FROM customer_payments WHERE id = $1`,
          [parseInt(id)]
        );

        console.log(`🗑️ [PAYMENT DELETED] ID: ${id} | Amount: ${amount} | Customer: ${customer_id} | Debt increased by ${amount} ✓`);
        res.json({ success: true, message: "تم حذف التسديد بنجاح وتم استرجاع المبلغ للحساب" });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Admin: Clear all transaction data (DELETE endpoint)
    app.delete("/api/admin/clear-transactions", async (req, res) => {
      try {
        console.log("🗑️ [ADMIN] Clear transactions endpoint called");
        
        // Clear customer transactions
        const resultTransactions = await pool.query('DELETE FROM customer_transactions');
        console.log(`✓ تم حذف ${resultTransactions.rowCount} معاملة من customer_transactions`);

        // Clear customer payments
        const resultPayments = await pool.query('DELETE FROM customer_payments');
        console.log(`✓ تم حذف ${resultPayments.rowCount} دفعة من customer_payments`);

        // Clear topup orders (orders with topup_customer_id only)
        const resultOrders = await pool.query('DELETE FROM orders WHERE customer_id IS NULL AND topup_customer_id IS NOT NULL');
        console.log(`✓ تم حذف ${resultOrders.rowCount} طلب توب أب من orders`);

        res.json({ 
          success: true, 
          message: "✅ تم مسح جميع البيانات بنجاح",
          cleared: {
            transactions: resultTransactions.rowCount,
            payments: resultPayments.rowCount,
            topupOrders: resultOrders.rowCount
          }
        });
        
      } catch (error) {
        console.error("❌ Error clearing data:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ⚠️ DANGEROUS: Delete ALL data from database (restore schema/structure only)
    app.delete("/api/admin/purge-all-data", async (req, res) => {
      try {
        console.log("🚨 [ADMIN] PURGE ALL DATA - Nuclear option called");
        
        // List of tables to clear (in order of dependencies)
        const tablesToClear = [
          'topup_orders_detail',
          'topup_orders',
          'order_items',
          'orders',
          'cart_items',
          'customer_payments',
          'customer_transactions',
          'customers',
          'topup_products',
          'topup_product_categories',
          'topup_companies',
          'products',
          'categories',
          'stores',
          'company_users'
        ];

        const results: any = {};

        // Delete all data from each table
        for (const table of tablesToClear) {
          try {
            const result = await pool.query(`DELETE FROM ${table}`);
            results[table] = result.rowCount;
            console.log(`✓ تم حذف ${result.rowCount} سجل من ${table}`);
          } catch (err: any) {
            console.log(`⚠️ ${table}: ${err.message}`);
          }
        }

        // Reset sequences
        const sequences = [
          'stores_id_seq',
          'categories_id_seq',
          'products_id_seq',
          'customers_id_seq',
          'orders_id_seq',
          'order_items_id_seq',
          'topup_companies_id_seq',
          'topup_product_categories_id_seq',
          'topup_products_id_seq',
          'topup_orders_id_seq',
          'company_users_id_seq'
        ];

        for (const seq of sequences) {
          try {
            await pool.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
            console.log(`✓ تم إعادة تعيين ${seq}`);
          } catch (err: any) {
            console.log(`⚠️ ${seq}: ${err.message}`);
          }
        }

        res.json({ 
          success: true, 
          message: "✅ تم حذف جميع البيانات بنجاح - الجداول جاهزة لبيانات جديدة",
          deleted: results
        });
        
      } catch (error) {
        console.error("❌ Error purging data:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Catch-all route - serve index.html for all non-API, non-file requests (SPA routing)
    app.use("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    const PORT = Number.parseInt(process.env.PORT || "3000", 10);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Test DB at: http://localhost:${PORT}/api/test-db`);
    });
    
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('❌ Server error:', e);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

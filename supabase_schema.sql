-- ==========================================
-- Supabase Database Schema for Commerce Platform
-- ==========================================
-- This file contains all necessary tables and structures
-- Run this in Supabase SQL Editor to set up your database

-- ==========================================
-- USERS TABLE
-- ==========================================
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

-- ==========================================
-- STORES TABLE
-- ==========================================
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
  primary_color TEXT DEFAULT '#4F46E5',
  store_type VARCHAR(50) DEFAULT 'regular'
);

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
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

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

-- ==========================================
-- ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10, 2)
);

-- ==========================================
-- CUSTOMERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  customer_type VARCHAR(50) DEFAULT 'cash',
  credit_limit DECIMAL(10, 2) DEFAULT 0,
  current_debt DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, phone)
);

-- ==========================================
-- CUSTOMER TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS customer_transactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- APP SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  store_id INTEGER UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  app_name TEXT,
  logo_url TEXT,
  admin_commission_percentage DECIMAL(5, 2) DEFAULT 0,
  primary_color TEXT DEFAULT '#4F46E5',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TOPUP COMPANIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS topup_companies (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TOPUP PRODUCT CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS topup_product_categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TOPUP PRODUCTS TABLE
-- ==========================================
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

-- ==========================================
-- AUCTIONS TABLE
-- ==========================================
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

-- ==========================================
-- AUCTION BIDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS auction_bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_price DECIMAL(10, 2) NOT NULL,
  bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Create Indexes for Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_topup_products_store_id ON topup_products(store_id);
CREATE INDEX IF NOT EXISTS idx_topup_companies_store_id ON topup_companies(store_id);
CREATE INDEX IF NOT EXISTS idx_auctions_store_id ON auctions(store_id);

-- ==========================================
-- Enable Row Level Security (Optional but Recommended)
-- ==========================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Insert Default Admin User (Change Password!)
-- ==========================================
-- INSERT INTO users (name, phone, password, role, email, is_active)
-- VALUES ('Admin', '1234567890', 'change_this_password', 'admin', 'admin@example.com', TRUE)
-- ON CONFLICT (phone) DO NOTHING;

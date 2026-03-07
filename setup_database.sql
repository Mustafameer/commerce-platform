-- Script to create the database and user (run this as postgres admin)
-- Run with: psql -U postgres -f setup_database.sql

-- Drop existing database if it exists (be careful!)
-- DROP DATABASE IF EXISTS multi_ecommerce;

-- Create the database
CREATE DATABASE multi_ecommerce
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to the new database
\c multi_ecommerce

-- Create tables (this will be done by the application automatically)
-- But you can run this manually too if needed

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
    store_id INTEGER NOT NULL REFERENCES stores(id),
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

CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    store_id INTEGER UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    app_name TEXT,
    logo_url TEXT,
    admin_commission_percentage DECIMAL(5, 2) DEFAULT 0,
    primary_color TEXT DEFAULT '#4F46E5',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (name, phone, password, role, email) 
VALUES ('Admin', 'admin', 'password', 'admin', 'admin@example.com')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample store (محمد store)
INSERT INTO stores (owner_id, store_name, slug, owner_name, owner_phone, status, is_active, category)
VALUES (1, 'محمد', 'mohammad', 'محمد', '0771234567', 'active', TRUE, 'عام')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample store 2
INSERT INTO stores (store_name, slug, owner_name, owner_phone, status, is_active, category)
VALUES ('متجر الهدايا', 'gift-store', 'احمد', '0772222222', 'active', TRUE, 'هدايا')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample store 3
INSERT INTO stores (store_name, slug, owner_name, owner_phone, status, is_active, category)
VALUES ('متجر الإلكترونيات', 'electronics-store', 'علي', '0773333333', 'active', TRUE, 'إلكترونيات')
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Display success message
SELECT 'Database setup completed successfully!' as status;

-- Show table list
\dt

-- Show user list
SELECT * FROM users;

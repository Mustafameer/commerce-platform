import express from "express";
import cors from "cors";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeDatabase } from "./db-init.ts";
import fs from "fs";
import { mkdir, unlink } from "fs/promises";
import crypto from "crypto";
import admin from "firebase-admin";
import archiver from "archiver";
import multer from "multer";
import sharp from "sharp";

// Fix: Ensure all admin endpoints use proper ID validation
console.log("📡 [SERVER] Server module loading...");

// 🔥 CRITICAL: Load .env first, always
dotenv.config();

console.log("✅ [STARTUP] Dotenv configuration loaded");

// 🔴 CRITICAL: Validate DATABASE_URL immediately - MUST be set before any database operations
console.log('\n🔍 [STARTUP] Validating required environment variables...');
const requiredEnvVars = {
  'DATABASE_URL': 'Cloud PostgreSQL connection string'
};

const missingVars = [];
for (const [varName, description] of Object.entries(requiredEnvVars)) {
  if (!process.env[varName] || process.env[varName].trim() === '') {
    missingVars.push(`  ❌ ${varName}: ${description}`);
  } else {
    console.log(`  ✅ ${varName}: Set (${process.env[varName].substring(0, 40)}...)`);
  }
}

if (missingVars.length > 0) {
  console.error('\n' + '='.repeat(60));
  console.error('🚨 FATAL: Missing required environment variables!');
  console.error('='.repeat(60));
  console.error('\nMissing:');
  missingVars.forEach(m => console.error(m));
  console.error('\n📋 Railway Setup Checklist:');
  console.error('  1. Go to https://railway.app/project/YOUR_PROJECT_ID/plugins');
  console.error('  2. Add PostgreSQL plugin (if not already added)');
  console.error('  3. DATABASE_URL will be auto-set by Railway PostgreSQL plugin');
  console.error('  4. Redeploy: git push (if using GitHub)');
  console.error('\n🔗 References:');
  console.error('  - Railway PostgreSQL: https://docs.railway.app/plugins/postgresql');
  console.error('  - Environment Variables: https://docs.railway.app/develop/variables');
  console.error('='.repeat(60) + '\n');
  process.exit(1);
}

console.log('✅ [STARTUP] All required environment variables are set\n');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
};

if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-bucket.appspot.com",
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.warn("⚠️ Firebase Admin SDK initialization failed:", err);
  }
} else {
  console.warn("⚠️ Firebase credentials not configured - using local file storage");
}

console.log("📡 [SERVER] Dotenv loaded");

// Log environment variables (at this point DATABASE_URL is guaranteed to be set)
console.log("📋 Environment Variables:");
console.log("  DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "... ✅");
console.log("  PORT:", process.env.PORT || "3000 (default)");
console.log("  NODE_ENV:", process.env.NODE_ENV || "development (default)");
console.log("  FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✓ Set" : "❌ Not set (local uploads only)");
console.log("  FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✓ Set" : "❌ Not set");

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

const connectionString = process.env.DATABASE_URL;

// ✅ DATABASE_URL is guaranteed to exist at this point (validated at startup)
console.log("✅ [SERVER] Using cloud DATABASE_URL from environment:", connectionString.substring(0, 60) + "...");

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

console.log("✅ [SERVER] Database pool created");
console.log("🔌 Database connection string:", connectionString.substring(0, 50) + "...");

// ✅ LOCAL IMAGE COMPRESSION & STORAGE (NO FIREBASE)
async function uploadAndCompressImageLocally(base64Data: string, filename: string): Promise<string> {
  try {
    const uploadsDir = path.join(__dirname, 'public', 'uploads', 'products');
    await mkdir(uploadsDir, { recursive: true });
    
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Create unique filename
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(7)}_${filename}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Convert base64 to buffer and COMPRESS with Sharp
    const buffer = Buffer.from(base64String, 'base64');
    
    // Compress and optimize image
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    
    // Write compressed image to disk
    await new Promise<void>((resolve, reject) => {
      fs.writeFile(filePath, compressedBuffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const imageUrl = `/uploads/products/${uniqueFilename}`;
    const sizeKB = (compressedBuffer.length / 1024).toFixed(2);
    console.log(`✅ Image saved & compressed: ${imageUrl} (${sizeKB}KB)`);
    return imageUrl;
  } catch (error) {
    console.error('❌ Image compression/upload error:', error);
    throw error;
  }
}

// Firebase Image Upload Helper Function (DEPRECATED - kept for backward compatibility)
async function uploadImageToFirebase(base64Data: string, filename: string): Promise<string> {
  // 🚫 NO FIREBASE - redirect to local compression
  return uploadAndCompressImageLocally(base64Data, filename);
}

function getLocalUploadsFilePath(fileUrl: string): string | null {
  if (typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) {
    return null;
  }

  const relativePath = fileUrl.replace(/^\//, '');
  const resolvedPath = path.resolve(__dirname, 'public', relativePath.replace(/\//g, path.sep));
  const uploadsRoot = path.resolve(__dirname, 'public', 'uploads');

  if (!resolvedPath.startsWith(uploadsRoot)) {
    return null;
  }

  return resolvedPath;
}

async function deleteLocalUploadIfExists(fileUrl: string): Promise<boolean> {
  const filePath = getLocalUploadsFilePath(fileUrl);
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }

  await unlink(filePath);
  return true;
}

async function cleanupSoldAuctionImages(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        a.id as auction_id,
        a.product_id,
        p.image_url,
        p.gallery
      FROM auctions a
      JOIN products p ON p.id = a.product_id
      WHERE a.sold_at IS NOT NULL
      AND a.sold_at <= NOW() - INTERVAL '7 days'
      AND (
        COALESCE(NULLIF(p.image_url, ''), '') <> ''
        OR COALESCE(NULLIF(BTRIM(p.gallery::text), ''), '') NOT IN ('[]', '{}')
      )
    `);

    if (!result.rows.length) {
      return;
    }

    let deletedFilesCount = 0;
    let cleanedProductsCount = 0;

    for (const row of result.rows) {
      const galleryItems = Array.isArray(row.gallery)
        ? row.gallery
        : typeof row.gallery === 'string'
          ? JSON.parse(row.gallery || '[]')
          : [];

      const imageUrls = new Set<string>();
      if (row.image_url) {
        imageUrls.add(String(row.image_url));
      }

      for (const item of galleryItems) {
        if (typeof item === 'string' && item) {
          imageUrls.add(item);
        }
      }

      for (const imageUrl of imageUrls) {
        try {
          const deleted = await deleteLocalUploadIfExists(imageUrl);
          if (deleted) {
            deletedFilesCount += 1;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to delete sold auction image: ${imageUrl}`, error);
        }
      }

      await pool.query(
        `UPDATE products
         SET image_url = NULL,
             gallery = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [row.product_id]
      );

      cleanedProductsCount += 1;
    }

    console.log(`🧹 Cleaned sold auction images for ${cleanedProductsCount} product(s), deleted ${deletedFilesCount} local file(s)`);
  } catch (error) {
    console.error('❌ Failed to cleanup sold auction images:', error);
  }
}

async function getStoreAuctionSalesTotal(storeId: number): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(final_sale_price), 0) as total
     FROM auctions
     WHERE store_id = $1 AND sold_at IS NOT NULL`,
    [storeId]
  );

  return parseFloat(result.rows[0]?.total || 0);
}

async function syncStoreAuctionSalesTotal(storeId: number): Promise<number> {
  await pool.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS total_regular_sales NUMERIC DEFAULT 0
  `);

  const actualTotal = await getStoreAuctionSalesTotal(storeId);

  await pool.query(
    `UPDATE stores
     SET total_regular_sales = $1
     WHERE id = $2`,
    [actualTotal, storeId]
  );

  return actualTotal;
}

async function testConnection() {
  try {
    console.log("🔄 Testing database connection...");
    console.log("🔌 Using connection string:", connectionString.substring(0, 50) + "...");
    
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
    console.log("📋 Checking if core tables exist...");
    
    // Check if stores table exists
    const storesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
      ) as exists
    `);
    
    if (storesCheck.rows[0].exists) {
      console.log("✅ Tables already exist - database is initialized");
      console.log("🔄 Running migrations for any missing columns...");
      try {
        await runMigrations();
      } catch (err: any) {
        console.warn("⚠️  Migration warning (continuing):", err.message?.substring(0, 80));
      }
      return true;
    }
    
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

      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
        max_uses INTEGER,
        usage_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    // ✅ CRITICAL FIX: Convert logo_url from VARCHAR(500) to TEXT
    // This allows storing Base64 encoded logos directly (permanent cloud storage)
    console.log('\n📸 [MIGRATION] Converting logo_url columns to TEXT for Base64 storage...');
    
    // Migrate stores.logo_url
    try {
      await pool.query(`
        ALTER TABLE stores 
        ALTER COLUMN logo_url TYPE TEXT;
      `);
      console.log('✅ Migration: stores.logo_url converted to TEXT');
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists') && !msg.includes('cannot change data type')) {
        console.log('ℹ️  stores.logo_url migration:', msg.substring(0, 80));
      }
    }
    
    // Migrate app_settings.logo_url
    try {
      await pool.query(`
        ALTER TABLE app_settings 
        ALTER COLUMN logo_url TYPE TEXT;
      `);
      console.log('✅ Migration: app_settings.logo_url converted to TEXT');
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists') && !msg.includes('cannot change data type')) {
        console.log('ℹ️  app_settings.logo_url migration:', msg.substring(0, 80));
      }
    }

    // Migrate topup_companies.logo_url
    try {
      await pool.query(`
        ALTER TABLE topup_companies 
        ALTER COLUMN logo_url TYPE TEXT;
      `);
      console.log('✅ Migration: topup_companies.logo_url converted to TEXT');
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists') && !msg.includes('cannot change data type')) {
        console.log('ℹ️  topup_companies.logo_url migration:', msg.substring(0, 80));
      }
    }
    
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

    // Add available_codes column to topup_products table
    await pool.query(`
      ALTER TABLE topup_products
      ADD COLUMN IF NOT EXISTS available_codes INTEGER DEFAULT 0;
    `);
    console.log("✅ Migration: available_codes column added to topup_products");

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

    // Add and fix auction_bids columns for flexible bidding
    try {
      // Add customer_id column if it doesn't exist
      await pool.query(`
        ALTER TABLE auction_bids
        ADD COLUMN IF NOT EXISTS customer_id INTEGER;
      `);
      console.log("✅ Migration: customer_id column added to auction_bids");
    } catch (e) {
      console.log("ℹ️  Migration note: customer_id column:", (e as any).message?.substring(0, 60));
    }

    try {
      // Make customer_id nullable
      await pool.query(`
        ALTER TABLE auction_bids
        ALTER COLUMN customer_id DROP NOT NULL;
      `);
      console.log("✅ Migration: customer_id made nullable for anonymous bids");
    } catch (e) {
      // May fail if column doesn't exist or is already nullable
      console.log("ℹ️  Migration note:", (e as any).message?.substring(0, 60));
    }

    // Drop the old foreign key constraint if it exists
    try {
      await pool.query(`
        ALTER TABLE auction_bids
        DROP CONSTRAINT IF EXISTS auction_bids_customer_id_fkey;
      `);
      console.log("✅ Migration: Dropped old auction_bids_customer_id_fkey");
    } catch (e) {
      // Ignore
    }

    // Add FK constraint as nullable
    try {
      await pool.query(`
        ALTER TABLE auction_bids
        ADD CONSTRAINT auction_bids_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log("✅ Migration: customer_id foreign key constraint created");
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists')) {
        console.log("ℹ️  FK constraint note:", msg.substring(0, 60));
      }
    }

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

    // Add missing auction columns to support the auction system properly
    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS auction_date DATE;
      `);
      console.log("✅ Migration: auction_date column added to auctions");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS auction_start_time TIME;
      `);
      console.log("✅ Migration: auction_start_time column added to auctions");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS auction_end_time TIME;
      `);
      console.log("✅ Migration: auction_end_time column added to auctions");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS current_highest_price DECIMAL(10, 2);
      `);
      console.log("✅ Migration: current_highest_price column added to auctions");
    } catch (e) {
      // Ignore if column already exists
    }

    // Make bidder_id nullable for anonymous bids
    try {
      await pool.query(`
        ALTER TABLE auction_bids
        ALTER COLUMN bidder_id DROP NOT NULL;
      `);
      console.log("✅ Migration: bidder_id made nullable for anonymous bids");
    } catch (e) {
      // Ignore if already nullable
    }

    // Add missing columns to auctions table
    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS current_highest_price DECIMAL(10, 2);
      `);
      console.log("✅ Migration: current_highest_price column added to auctions");
    } catch (e) {
      // Column might already exist
    }

    try {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS winner_id INTEGER;
      `);
      console.log("✅ Migration: winner_id column added to auctions");
    } catch (e) {
      // Column might already exist
    }

    // Add missing auction_bids columns for proper bid placement
    try {
      await pool.query(`
        ALTER TABLE auction_bids
        ADD COLUMN IF NOT EXISTS bid_price DECIMAL(10, 2);
      `);
      console.log("✅ Migration: bid_price column added to auction_bids");
    } catch (e) {
      // Ignore if column already exists
    }

    // Rename bid_amount to bid_price if both exist, keep bid_price
    try {
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'auction_bids' AND column_name = 'bid_amount'
      `);
      
      if (result.rows.length > 0) {
        // Copy bid_amount to bid_price if bid_price is empty
        await pool.query(`
          UPDATE auction_bids 
          SET bid_price = bid_amount 
          WHERE bid_price IS NULL AND bid_amount IS NOT NULL
        `);
        console.log("✅ Migration: Migrated bid_amount to bid_price");
      }
    } catch (e) {
      console.log("ℹ️  Migration note:", (e as any).message?.substring(0, 60));
    }

    // Add bid_price as an alias/view if needed
    try {
      await pool.query(`
        ALTER TABLE auction_bids
        ADD COLUMN IF NOT EXISTS bid_price_alias DECIMAL(10, 2) 
        GENERATED ALWAYS AS (bid_amount) STORED;
      `);
    } catch (e) {
      // Ignore - might already exist or not needed
    }

    // Create index for auction_bids queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id 
      ON auction_bids(auction_id);
    `);
    console.log("✅ Index: idx_auction_bids_auction_id created");

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

    // Indices for statement endpoint performance (customer queries)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_topup_customer_id 
      ON orders(topup_customer_id) WHERE is_topup_order = true;
    `);
    console.log("✅ Index: idx_orders_topup_customer_id created");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id_topup 
      ON orders(customer_id) WHERE is_topup_order = true;
    `);
    console.log("✅ Index: idx_orders_customer_id_topup created");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id 
      ON customer_payments(customer_id);
    `);
    console.log("✅ Index: idx_customer_payments_customer_id created");

    // Add updated_at column to stores if it doesn't exist (critical fix for regular stores)
    await pool.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("✅ Migration: updated_at column added to stores");

    // Fix: Convert all VARCHAR(n) columns to TEXT to avoid "value too long" errors
    try {
      // Get all VARCHAR columns with character_maximum_length from ALL tables
      const allVarcharCols = await pool.query(`
        SELECT table_name, column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE data_type = 'character varying'
        AND character_maximum_length IS NOT NULL
        AND table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
        ORDER BY table_name, column_name
      `);
      
      if (allVarcharCols.rows.length > 0) {
        console.log('\n🔍 Found VARCHAR columns in database:');
        
        // Group by table
        const byTable = {};
        for (const col of allVarcharCols.rows) {
          if (!byTable[col.table_name]) byTable[col.table_name] = [];
          byTable[col.table_name].push(col);
        }
        
        // Convert all VARCHAR columns to TEXT
        for (const [tableName, cols] of Object.entries(byTable)) {
          console.log(`\n📊 Table: ${tableName}`);
          for (const col of cols) {
            console.log(`   - ${col.column_name}: ${col.data_type}(${col.character_maximum_length})`);
            try {
              await pool.query(`
                ALTER TABLE ${tableName}
                ALTER COLUMN ${col.column_name} TYPE TEXT
              `);
              console.log(`   ✅ Converted to TEXT`);
            } catch (e) {
              const msg = (e as any).message || '';
              if (!msg.includes('already exists')) {
                console.log(`   ℹ️  ${msg.substring(0, 60)}`);
              }
            }
          }
        }
        console.log('\n✅ All VARCHAR columns converted to TEXT');
      }
    } catch (e) {
      console.log("ℹ️  Migration note:", (e as any).message?.substring(0, 60));
    }

    // Add missing stock column to products table
    try {
      await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0
      `);
      console.log('✅ Migration: stock column added to products table');
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists')) {
        console.log('ℹ️  Stock column migration:', msg.substring(0, 60));
      }
    }

    // Add image_url column to products table if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS image_url TEXT
      `);
      console.log('✅ Migration: image_url column added to products table');
    } catch (e) {
      const msg = (e as any).message || '';
      if (!msg.includes('already exists')) {
        console.log('ℹ️  image_url column migration:', msg.substring(0, 60));
      }
    }

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
    console.log("▶️  Initializing seed data...");
    
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

    // Check if app settings exist
    const settingsCheck = await pool.query("SELECT id FROM app_settings LIMIT 1");
    if (settingsCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO app_settings (app_name, logo_url, admin_commission_percentage) VALUES ($1, $2, $3)",
        ['Commerce Platform', 'https://via.placeholder.com/150', 5]
      );
      console.log("✅ Default app settings created");
    }

    console.log("✅ Seed data initialization complete");
  } catch (error) {
    console.warn("⚠️  Seed data warning:", (error as any).message);
  }
}

async function ensureMissingTables() {
  try {
    console.log('📸 [SERVER] Ensuring topup_product_images table exists...');
    
    // First, check if the table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'topup_product_images'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ [SERVER] topup_product_images table already exists');
      return;
    }
    
    console.log('🔨 [SERVER] Creating topup_product_images table...');
    
    // Verify that referenced tables exist first
    const storesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
      )
    `);
    
    const productsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'topup_products'
      )
    `);
    
    if (!storesCheck.rows[0].exists) {
      console.warn('⚠️  [SERVER] stores table not found - skipping topup_product_images creation');
      return;
    }
    
    if (!productsCheck.rows[0].exists) {
      console.warn('⚠️  [SERVER] topup_products table not found - skipping topup_product_images creation');
      return;
    }
    
    console.log('✓ [SERVER] Referenced tables exist, creating topup_product_images...');
    
    // Create topup_product_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topup_product_images (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
        image_data TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'svg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, product_id, image_data)
      )
    `);
    
    console.log('✓ [SERVER] Table created');
    
    // Create indexes
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_store_product ON topup_product_images(store_id, product_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_created ON topup_product_images(created_at)`);
      console.log('✓ [SERVER] Indexes created');
    } catch (idxErr) {
      console.warn('⚠️  [SERVER] Index creation warning:', (idxErr as any).message.substring(0, 50));
    }
    
    console.log('✅ [SERVER] topup_product_images table ensured successfully');
  } catch (error) {
    console.error('❌ [SERVER] Error ensuring tables:', (error as any).message);
    console.error('    Details:', (error as any).detail || (error as any).toString().substring(0, 100));
  }
}

async function startServer() {
  try {
    // Test database connection first
    const connected = await testConnection();
    if (!connected) {
      console.warn("⚠️  Database connection failed, but starting server anyway (check database settings)");
    } else {
      // Ensure all required tables exist
      await ensureMissingTables();
      
      // Load/restore data from backup if database is empty
      // 🔥 CRITICAL: Use the same connection string used for pool!
      try {
        await initializeDatabase(connectionString);
      } catch (error: any) {
        console.warn("⚠️  Database initialization warning (continuing):", error.message?.substring(0, 100));
      }
      
      // Only initialize DB if connected
      try {
        await initDb();
      } catch (error: any) {
        console.warn("⚠️  Table creation warning (continuing):", error.message?.substring(0, 100));
      }
      
      // Seed default data
      try {
        await seedData();
      } catch (error: any) {
        console.warn("⚠️  Seed data warning (continuing):", error.message?.substring(0, 100));
      }
    }
    
    const app = express();
    
    // Configure CORS: CLOUD ONLY (no localhost connections)
    const isDev = process.env.NODE_ENV !== 'production';
    const allowedOrigins = isDev 
      ? [
          // Development local ports only when NODE_ENV != production
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ]
      : [
          // Production: Only cloud domain(s)
          'https://web-production-9efff.up.railway.app',
          // Add other production domains here if needed
        ];
    
    console.log('🔒 [CORS] Allowed origins:', allowedOrigins);
    
    app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
    }));
    
    // Increase JSON body size limit to allow base64 images (logos) in settings
    app.use(express.json({ limit: "10mb" }));
    
    // Configure multer for file uploads (multipart/form-data)
    const upload = multer({
      storage: multer.memoryStorage(), // Store files in memory for processing
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB per file
        files: 100 // Max 100 files per request
      },
      fileFilter: (req, file, cb) => {
        // Only accept image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
    
    // Define distPath early so it's available for all routes
    const distPath = path.join(__dirname, "dist");
    const isDev = !fs.existsSync(distPath);
    
    if (isDev) {
      console.log("🔧 Development mode detected - dist folder not found");
      console.log("⚠️  Using Vite dev server for frontend");
    }
    
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

    // Diagnostic endpoint for TopupStorefront
    app.get("/api/diagnostic/topup", async (req, res) => {
      try {
        console.log("🔍 Running TopupStorefront diagnostic...");
        
        const store13 = await pool.query("SELECT * FROM stores WHERE id = 13");
        const companies13 = await pool.query("SELECT * FROM topup_companies WHERE store_id = 13");
        const products13 = await pool.query("SELECT id, amount, price, images FROM topup_products WHERE store_id = 13 LIMIT 5");
        const imagesTable = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'topup_product_images'
          ) as exists
        `);
        const imagesCount = await pool.query("SELECT COUNT(*) as count FROM topup_product_images");
        
        const result = {
          store_13: store13.rows[0] || null,
          companies_count: companies13.rows.length,
          companies: companies13.rows,
          products_count: products13.rows.length,
          products_sample: products13.rows,
          topup_product_images_table_exists: imagesTable.rows[0].exists,
          topup_product_images_count: imagesCount.rows[0].count
        };
        
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: (error as any).message,
          details: (error as any).detail
        });
      }
    });

    // Create images table and add sample images (GET for easy browser access)
    app.get("/api/setup/images-table", async (req, res) => {
      try {
        console.log('📸 Setting up topup product images table (Store 13 only)...');
        
        // Step 1: Create the table if it doesn't exist - ONLY for topup products
        console.log('   Creating topup_product_images table (Store 13 only)...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS topup_product_images (
            id SERIAL PRIMARY KEY,
            topup_product_id INTEGER NOT NULL UNIQUE REFERENCES topup_products(id) ON DELETE CASCADE,
            image_data TEXT NOT NULL,
            image_type VARCHAR(50) DEFAULT 'svg',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('   ✓ Table created');
        
        // Step 2: Create indexes
        console.log('   Creating indexes...');
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_product_id ON topup_product_images(topup_product_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_topup_product_images_created ON topup_product_images(created_at)`);
        console.log('   ✓ Indexes created');
        
        // Step 3: Add sample images for each product in store 13 ONLY
        console.log('   Adding sample images to Store 13 products...');
        
        const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+';
        const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+';
        const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MTV4NTwvdGV4dD48L3N2Zz4=';
        
        // Get all products from store 13 ONLY
        const products = await pool.query('SELECT id FROM topup_products WHERE store_id = 13 ORDER BY id');
        
        if (products.rows.length === 0) {
          console.log('   ⚠️  No products found in store 13');
          return res.json({
            success: true,
            message: '✅ Images table ready (no products in store 13)',
            table_created: true,
            total_images: 0,
            products_updated: 0,
            store: 13
          });
        }
        
        let insertedCount = 0;
        const images = [svg1, svg2, svg3]; // 3 different images
        
        for (const product of products.rows) {
          try {
            // Add ONE image per product
            await pool.query(`
              INSERT INTO topup_product_images (topup_product_id, image_data, image_type)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING
            `, [product.id, images[insertedCount % 3], 'svg']);
            
            insertedCount++;
          } catch (err) {
            console.error(`   Error adding image to product ${product.id}:`, (err as any).message);
          }
        }
        
        console.log(`   ✓ Added ${insertedCount} images for ${products.rows.length} products`);
        
        // Step 4: Return status
        const imageCount = await pool.query('SELECT COUNT(*) as count FROM topup_product_images');
        
        res.json({
          success: true,
          message: '✅ Topup product images table setup complete',
          table_created: true,
          total_images: imageCount.rows[0].count,
          products_updated: products.rows.length,
          store: 13,
          note: 'جدول مخصص فقط لصور منتجات متجر الشحن - Store 13'
        });
        
      } catch (error) {
        console.error('❌ Error setting up images table:', (error as any).message);
        res.status(500).json({
          success: false,
          error: (error as any).message
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

    // Clear all data from database
    app.post("/api/clear-all", async (req, res) => {
      try {
        console.log("🗑️  Clearing all data from database...");
        
        const client = await pool.connect();
        try {
          // Order matters due to foreign keys
          const tables = [
            'auction_bids',
            'auctions',
            'topup_orders_detail',
            'topup_orders',
            'order_items',
            'orders',
            'cart_items',
            'customer_payments',
            'customer_transactions',
            'customers',
            'topup_product_images',
            'topup_products',
            'topup_product_categories',
            'topup_companies',
            'products',
            'categories',
            'merchant_applications',
            'company_users',
            'app_settings',
            'stores',
            'users'
          ];

          for (const table of tables) {
            try {
              await client.query(`TRUNCATE TABLE ${table} CASCADE`);
            } catch (e) {
              await client.query(`DELETE FROM ${table}`);
            }
          }

          res.json({
            success: true,
            message: "جميع البيانات تم حذفها بنجاح!",
            clearCache: true,
            redirect: "/",
          });
          console.log("✅ جميع البيانات تم حذفها بنجاح!");
        } finally {
          await client.release();
        }
      } catch (error) {
        console.error("❌ خطأ في حذف البيانات:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // Get stores (public - only active)
    app.get("/api/stores", async (req, res) => {
      try {
        const { limit = 50, offset = 0, includeInactive = false } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 50, 500);
        const offsetNum = Math.max(0, parseInt(offset as string) || 0);
        
        console.log('🏪 GET /api/stores called:', { limit: limitNum, offset: offsetNum, includeInactive });
        
        let query = `
          SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone, category as description
          FROM stores
        `;
        
        // Only filter by is_active if not explicitly requesting inactive stores
        if (includeInactive !== 'true') {
          query += 'WHERE is_active = true OR is_active IS NULL ';
        }
        
        query += `
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `;
        
        console.log('🔍 SQL Query:', query.substring(0, 200) + '...');
        
        const result = await pool.query(query, [limitNum, offsetNum]);
        
        console.log('✅ Stores fetched:', { count: result.rows.length, stores: result.rows.map((s: any) => ({ id: s.id, name: s.store_name })) });
        
        res.set('Cache-Control', 'public, max-age=60'); // 1 minute
        res.json(result.rows);
      } catch (error) {
        console.error('❌ Error fetching stores:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : '' });
        res.status(500).json({ error: (error as any).message || 'Failed to fetch stores' });
      }
    });

    // Get ALL stores for admin dashboard (including inactive/suspended)
    app.get("/api/admin/stores", async (req, res) => {
      try {
        const { limit = 100, offset = 0 } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 100, 1000);
        const offsetNum = Math.max(0, parseInt(offset as string) || 0);
        
        console.log('📍 /api/admin/stores called - limit:', limitNum, 'offset:', offsetNum);
        
        const result = await pool.query(`
          SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone, owner_id, percentage_enabled, subscription_paid, commission_percentage
          FROM stores
          ORDER BY 
            CASE status 
              WHEN 'pending' THEN 1 
              WHEN 'approved' THEN 2 
              WHEN 'suspended' THEN 3 
              ELSE 4 
            END,
            created_at DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum]);
        
        console.log('✅ Query result:', result.rows.length, 'stores found');
        result.rows.forEach(s => {
          console.log(`   - ID:${s.id} | ${s.store_name} | Status:${s.status} | Active:${s.is_active}`);
        });
        
        res.json(result.rows);
      } catch (error) {
        console.error("❌ Admin stores error:", error);
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
        
        console.log('📝 Store creation request:', { store_name, owner_name, owner_phone });
        
        // Validate required fields
        if (!store_name || !owner_name || !owner_phone) {
          console.error('❌ Missing required fields');
          return res.status(400).json({ error: 'اسم المتجر واسم المالك ورقم الهاتف مطلوبة' });
        }
        
        // 1. Check if user exists with this phone
        let userId;
        const userCheck = await pool.query("SELECT id FROM users WHERE phone = $1", [owner_phone]);
        
        if (userCheck.rows.length > 0) {
          userId = userCheck.rows[0].id;
          console.log('✅ User exists:', userId);
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
          console.log('✅ New user created:', userId);
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
        console.log('✅ Store created with ID:', storeId, 'Status:', result.rows[0].status);
        
        // 5. Link user to store
        await pool.query(
          "UPDATE users SET store_id = $1 WHERE id = $2",
          [storeId, userId]
        );
        
        console.log('✅ Store creation complete. Returning:', { storeId, status: result.rows[0].status });
        
        res.json({
          store: result.rows[0],
          user: { id: userId, name: owner_name, phone: owner_phone, role: 'merchant' },
          message: 'تم إنشاء المتجر والمستخدم بنجاح'
        });
      } catch (error) {
        console.error('❌ Store creation error:', (error as any).message);
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
          "SELECT id, name, phone, store_id, customer_type, password FROM customers WHERE phone = $1",
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
            "SELECT id, name, phone FROM customers WHERE id = $1",
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
          app_name: "",
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

    // update app settings - LOGO STORAGE FIX: Save as Base64 directly to database
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
        
        // ✅ LOGO FIX: Accept Base64 and compress if needed
        let processedLogoUrl = logo_url;
        
        if (logo_url && logo_url.startsWith('data:image')) {
          try {
            console.log('🎨 Processing logo for storage...');
            
            // Extract base64 data
            const base64Data = logo_url.replace(/^data:image\/[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            console.log(`  Original size: ${(buffer.length / 1024).toFixed(2)} KB`);
            
            // Compress if larger than 200KB
            if (buffer.length > 200 * 1024) {
              console.log('  Compressing logo (size > 200KB)...');
              const compressedBuffer = await sharp(buffer)
                .resize(200, 200, { fit: 'contain', withoutEnlargement: true })
                .png({ quality: 80 })
                .toBuffer();
              
              const compressedSize = (compressedBuffer.length / 1024).toFixed(2);
              console.log(`  ✅ Compressed: ${compressedSize} KB`);
              
              // Convert back to base64
              processedLogoUrl = 'data:image/png;base64,' + compressedBuffer.toString('base64');
            }
            
            // Validate final size (max 1.5MB for database)
            if (processedLogoUrl.length > 1.5 * 1024 * 1024) {
              console.error("❌ Logo still too large after compression");
              return res.status(400).json({ 
                message: "الصورة كبيرة جداً", 
                success: false, 
                error: "حجم الشعار يجب ألا يتجاوز 1.5 MB حتى بعد الضغط" 
              });
            }
            
            console.log(`✅ Logo ready for database storage: ${(processedLogoUrl.length / 1024).toFixed(2)} KB`);
          } catch (compressErr) {
            console.warn('⚠️ Logo compression warning (storing original):', (compressErr as any).message);
            // Keep original if compression fails
          }
        } else if (logo_url && logo_url.length > 2 * 1024 * 1024) {
          // If it's not base64 but still huge, reject
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
            values.push(processedLogoUrl);
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
          console.log("📊 Update values:", values.map((v, i) => i === 1 && v && v.startsWith('data:') ? `[base64 logo ${(v.length/1024).toFixed(1)}KB]` : v));
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
        // ✅ LOGO FIX: Use processed logo here too
        
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
            values.push(processedLogoUrl);
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
            [app_name, processedLogoUrl, primary_color, admin_commission_percentage]
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
                      COALESCE(NULLIF(o.status, ''), 'pending') as status,
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
                      COALESCE(NULLIF(o.status, ''), 'pending') as status,
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
        
        // For topup orders: update current_debt ONLY
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        if (is_topup && topupCustomerId) {
          await pool.query(
            `UPDATE customers SET 
              current_debt = current_debt + $1
             WHERE id = $2`,
            [total_amount - (discount_amount || 0), topupCustomerId]
          );
        }
        
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

    const deleteOrderAndRestoreState = async (orderId: number) => {
      const client = await pool.connect();
      try {
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
            `UPDATE customers SET current_debt = GREATEST(0, current_debt - $1) WHERE id = $2 RETURNING current_debt`,
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
        return { message: "تم حذف الطلب بنجاح", success: true, deleted: result.rows[0] };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ [RETURN ORDER] Error:`, error);
        throw error;
      } finally {
        client.release();
      }
    };

    // Return order (delete it)
    app.patch("/api/orders/:id/return", async (req, res) => {
      try {
        const { id } = req.params;
        const orderId = parseInt(id);
        const result = await deleteOrderAndRestoreState(orderId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete order completely and restore stock/state
    app.delete("/api/orders/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const orderId = parseInt(id);
        const result = await deleteOrderAndRestoreState(orderId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
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
        const { code, store_id, order_amount } = req.body;
        
        const coupon = await pool.query(
          `SELECT * FROM coupons 
           WHERE code = $1 AND store_id = $2 AND is_active = true`,
          [code, store_id]
        );
        
        if (coupon.rows.length === 0) {
          return res.status(400).json({ error: "كود غير صحيح" });
        }
        
        const cp = coupon.rows[0];
        const now = new Date();
        
        // التحقق من صلاحية الفترة الزمنية
        if (cp.valid_from && new Date(cp.valid_from) > now) {
          return res.status(400).json({ error: "الكود لم يبدأ بعد" });
        }
        
        if (cp.valid_until && new Date(cp.valid_until) < now) {
          return res.status(400).json({ error: "انتهت صلاحية الكود" });
        }
        
        // التحقق من حد الاستخدام
        if (cp.max_uses && cp.usage_count >= cp.max_uses) {
          return res.status(400).json({ error: "انتهت مرات استخدام الكود" });
        }
        
        // التحقق من الحد الأدنى للمبلغ
        if (cp.min_purchase_amount && order_amount < cp.min_purchase_amount) {
          return res.status(400).json({ 
            error: `الحد الأدنى للطلب ${cp.min_purchase_amount}` 
          });
        }
        
        // حساب الخصم
        let discount = 0;
        if (cp.discount_type === 'percentage') {
          discount = Math.floor((order_amount * cp.discount_value) / 100);
        } else {
          discount = cp.discount_value;
        }
        
        res.json({
          valid: true,
          id: cp.id,
          code: code,
          discount_type: cp.discount_type,
          discount_value: cp.discount_value,
          discount_amount: discount
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create coupon (merchant)
    app.post("/api/merchant/coupons", async (req, res) => {
      try {
        const { store_id, code, discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until } = req.body;
        
        // التحقق من أن التاجر يملك المتجر
        const storeCheck = await pool.query(
          `SELECT id FROM stores WHERE id = $1 AND user_id = $2`,
          [store_id, (req as any).user?.id]
        );
        
        if (storeCheck.rows.length === 0) {
          return res.status(403).json({ error: "ليس لديك صلاحيات" });
        }
        
        const result = await pool.query(
          `INSERT INTO coupons (store_id, code, discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [store_id, code.toUpperCase(), discount_type, discount_value, min_purchase_amount || 0, max_uses || null, valid_from || null, valid_until || null]
        );
        
        res.json({ success: true, coupon: result.rows[0] });
      } catch (error: any) {
        if (error.code === '23505') {
          res.status(400).json({ error: "كود موجود بالفعل" });
        } else {
          res.status(500).json({ error: (error as any).message });
        }
      }
    });

    // Get merchant coupons
    app.get("/api/merchant/coupons", async (req, res) => {
      try {
        const storeId = req.query.store_id;
        
        const storeCheck = await pool.query(
          `SELECT id FROM stores WHERE id = $1 AND user_id = $2`,
          [storeId, (req as any).user?.id]
        );
        
        if (storeCheck.rows.length === 0) {
          return res.status(403).json({ error: "ليس لديك صلاحيات" });
        }
        
        const result = await pool.query(
          `SELECT * FROM coupons WHERE store_id = $1 ORDER BY created_at DESC`,
          [storeId]
        );
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Update coupon
    app.put("/api/merchant/coupons/:id", async (req, res) => {
      try {
        const { discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until, is_active } = req.body;
        
        const coupon = await pool.query(
          `SELECT c.* FROM coupons c 
           JOIN stores s ON c.store_id = s.id 
           WHERE c.id = $1 AND s.user_id = $2`,
          [req.params.id, (req as any).user?.id]
        );
        
        if (coupon.rows.length === 0) {
          return res.status(403).json({ error: "ليس لديك صلاحيات" });
        }
        
        const result = await pool.query(
          `UPDATE coupons SET discount_type = COALESCE($1, discount_type),
            discount_value = COALESCE($2, discount_value),
            min_purchase_amount = COALESCE($3, min_purchase_amount),
            max_uses = COALESCE($4, max_uses),
            valid_from = COALESCE($5, valid_from),
            valid_until = COALESCE($6, valid_until),
            is_active = COALESCE($7, is_active),
            updated_at = NOW()
           WHERE id = $8 RETURNING *`,
          [discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until, is_active, req.params.id]
        );
        
        res.json({ success: true, coupon: result.rows[0] });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete coupon
    app.delete("/api/merchant/coupons/:id", async (req, res) => {
      try {
        const coupon = await pool.query(
          `SELECT c.* FROM coupons c 
           JOIN stores s ON c.store_id = s.id 
           WHERE c.id = $1 AND s.user_id = $2`,
          [req.params.id, (req as any).user?.id]
        );
        
        if (coupon.rows.length === 0) {
          return res.status(403).json({ error: "ليس لديك صلاحيات" });
        }
        
        await pool.query(`DELETE FROM coupons WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Increment coupon usage
    app.post("/api/coupons/:id/use", async (req, res) => {
      try {
        await pool.query(
          `UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1`,
          [req.params.id]
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get coupons for frontend (with storeId query param)
    app.get("/api/coupons", async (req, res) => {
      try {
        const storeId = req.query.storeId;
        if (!storeId) {
          return res.json([]);
        }
        const result = await pool.query(
          `SELECT * FROM coupons WHERE store_id = $1 AND is_active = true ORDER BY created_at DESC`,
          [storeId]
        );
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create coupon (frontend - unauthenticated for now, but should add auth)
    app.post("/api/coupons", async (req, res) => {
      try {
        const { store_id, code, discount_type, discount_value, min_order_value, usage_limit, expiry_date } = req.body;
        
        const result = await pool.query(
          `INSERT INTO coupons (store_id, code, discount_type, discount_value, min_purchase_amount, max_uses, valid_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, code, discount_type, discount_value, min_purchase_amount, max_uses, valid_until, usage_count`,
          [
            store_id, 
            code.toUpperCase(), 
            discount_type, 
            discount_value, 
            min_order_value || 0, 
            usage_limit || null, 
            expiry_date || null
          ]
        );
        
        res.json(result.rows[0]);
      } catch (error: any) {
        if (error.code === '23505') {
          res.status(400).json({ error: "كود موجود بالفعل" });
        } else {
          res.status(500).json({ error: (error as any).message });
        }
      }
    });

    // Delete coupon (frontend)
    app.delete("/api/coupons/:id", async (req, res) => {
      try {
        await pool.query(`DELETE FROM coupons WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Merchant stats
    app.get("/api/merchant/stats", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;

        await pool.query(`
          ALTER TABLE stores
          ADD COLUMN IF NOT EXISTS total_regular_sales NUMERIC DEFAULT 0
        `);
        
        if (!storeId || isNaN(Number(storeId))) {
          return res.json({
            totalRevenue: 0,
            netRevenue: 0,
            adminCommission: 0,
            orderStats: { total: 0, pending: 0, completed: 0 },
            fulfillmentStats: { total: 0, pending: 0, completed: 0 },
            topProducts: []
          });
        }

        const storeIdNum = parseInt(storeId);

        // Get store info for commission calculation
        const storeResult = await pool.query(
          "SELECT percentage_enabled, commission_percentage, total_regular_sales, store_type FROM stores WHERE id = $1",
          [storeIdNum]
        );
        const percentageEnabled = storeResult.rows.length > 0 ? storeResult.rows[0].percentage_enabled : false;
        const commissionPercentage = storeResult.rows.length > 0 ? parseFloat(storeResult.rows[0].commission_percentage) : 0;
        const auctionSalesRevenue = await syncStoreAuctionSalesTotal(storeIdNum);
        const storeType = storeResult.rows.length > 0 ? storeResult.rows[0].store_type : null;

        // Get total revenue (only completed orders)
        const revenueResult = await pool.query(
          "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE store_id = $1 AND status = 'completed'",
          [storeIdNum]
        );
        const completedOrdersRevenue = parseFloat(revenueResult.rows[0].total);
        const totalRevenue = completedOrdersRevenue + auctionSalesRevenue;
        
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
          "SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND COALESCE(NULLIF(status, ''), 'pending') = 'pending'",
          [storeIdNum]
        );
        const pending = parseInt(pendingOrdersResult.rows[0].count);

        const completedOrdersResult = await pool.query(
          "SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND status = 'completed'",
          [storeIdNum]
        );
        const completed = parseInt(completedOrdersResult.rows[0].count);

        let fulfillmentPending = pending;
        let fulfillmentCompleted = completed;
        let fulfillmentTotal = total;

        if (storeType !== 'topup') {
          const pendingAuctionResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM auctions a
             WHERE a.store_id = $1
             AND a.sold_at IS NULL
             `,
            [storeIdNum]
          );

          const completedAuctionResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM auctions a
             WHERE a.store_id = $1
             AND a.sold_at IS NOT NULL`,
            [storeIdNum]
          );

          const pendingAuctions = parseInt(pendingAuctionResult.rows[0].count);
          const completedAuctions = parseInt(completedAuctionResult.rows[0].count);

          fulfillmentPending += pendingAuctions;
          fulfillmentCompleted += completedAuctions;
          fulfillmentTotal += pendingAuctions + completedAuctions;
        }

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
          fulfillmentStats: { total: fulfillmentTotal, pending: fulfillmentPending, completed: fulfillmentCompleted },
          topProducts
        });
      } catch (error) {
        console.error("Merchant stats error:", error);
        res.json({
          totalRevenue: 0,
          netRevenue: 0,
          adminCommission: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          fulfillmentStats: { total: 0, pending: 0, completed: 0 },
          topProducts: []
        });
      }
    });

    app.get("/api/merchant/sales-report", async (req, res) => {
      try {
        const storeId = req.query.storeId as string;
        const fromDate = req.query.from as string | undefined;
        const toDate = req.query.to as string | undefined;
        const saleType = (req.query.saleType as string | undefined) || 'all';

        if (!storeId || isNaN(Number(storeId))) {
          return res.status(400).json({ error: "Invalid store ID" });
        }

        if (!['all', 'order', 'auction'].includes(saleType)) {
          return res.status(400).json({ error: "Invalid sale type" });
        }

        const storeIdNum = parseInt(storeId, 10);
        const filters: string[] = ["store_id = $1"];
        const values: any[] = [storeIdNum];
        let paramIndex = 2;

        if (fromDate) {
          filters.push(`sale_date >= $${paramIndex++}::date`);
          values.push(fromDate);
        }

        if (toDate) {
          filters.push(`sale_date < ($${paramIndex++}::date + INTERVAL '1 day')`);
          values.push(toDate);
        }

        if (saleType !== 'all') {
          filters.push(`sale_type = $${paramIndex++}`);
          values.push(saleType);
        }

        const salesResult = await pool.query(
          `WITH all_sales AS (
             SELECT 
               o.id,
               o.store_id,
               o.created_at as sale_date,
               (o.total_amount - COALESCE(o.discount_amount, 0))::numeric as amount,
               'order'::text as sale_type
             FROM orders o
             WHERE o.status = 'completed'

             UNION ALL

             SELECT 
               a.id,
               a.store_id,
               a.sold_at as sale_date,
               COALESCE(a.final_sale_price, 0)::numeric as amount,
               'auction'::text as sale_type
             FROM auctions a
             WHERE a.sold_at IS NOT NULL
           )
           SELECT id, store_id, sale_date, amount, sale_type
           FROM all_sales
           WHERE ${filters.join(' AND ')}
           ORDER BY sale_date ASC`,
          values
        );

        const rows = salesResult.rows.map((row: any) => ({
          ...row,
          amount: parseFloat(row.amount || 0),
          saleDate: new Date(row.sale_date)
        }));

        const createRangeKey = (date: Date, period: 'daily' | 'weekly' | 'monthly') => {
          const current = new Date(date);
          current.setHours(0, 0, 0, 0);

          if (period === 'daily') {
            return current.toISOString().slice(0, 10);
          }

          if (period === 'monthly') {
            return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          }

          const day = current.getDay();
          const diffToWeekStart = day === 0 ? 6 : day - 1;
          current.setDate(current.getDate() - diffToWeekStart);
          return current.toISOString().slice(0, 10);
        };

        const createRangeLabel = (key: string, period: 'daily' | 'weekly' | 'monthly') => {
          if (period === 'daily') {
            return key;
          }

          if (period === 'monthly') {
            const [year, month] = key.split('-');
            return `${year}/${month}`;
          }

          const start = new Date(`${key}T00:00:00`);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return `${start.toISOString().slice(5, 10)} - ${end.toISOString().slice(5, 10)}`;
        };

        const aggregateByPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
          const bucket = new Map<string, { total: number; order_count: number }>();

          rows.forEach((row) => {
            const key = createRangeKey(row.saleDate, period);
            const current = bucket.get(key) || { total: 0, order_count: 0 };
            current.total += row.amount;
            current.order_count += 1;
            bucket.set(key, current);
          });

          return Array.from(bucket.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => ({
              period: createRangeLabel(key, period),
              total: value.total,
              order_count: value.order_count,
              key
            }));
        };

        const totalRevenue = rows.reduce((sum, row) => sum + row.amount, 0);
        const totalOrders = rows.length;

        res.json({
          daily: aggregateByPeriod('daily'),
          weekly: aggregateByPeriod('weekly'),
          monthly: aggregateByPeriod('monthly'),
          summary: {
            totalRevenue,
            totalOrders,
            averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            from: fromDate || null,
            to: toDate || null,
            saleType
          }
        });
      } catch (error) {
        console.error("Error fetching merchant sales report:", error);
        res.status(500).json({ error: "Failed to fetch merchant sales report" });
      }
    });

    // Admin stats
    app.get("/api/admin/stats", async (req, res) => {
      try {
        const salesStatuses = ['pending', 'completed'];
        const storesResult = await pool.query("SELECT COUNT(*) as count FROM stores");
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
        // No cache for product data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        
        // ✅ CRITICAL: Convert dates to text format to avoid JavaScript Date object conversion
        let query = `SELECT products.*, 
          wholesale_price AS bulk_price, 
          stores.store_name, 
          stores.primary_color, 
          stores.store_type, 
          categories.name as category_name,
          TO_CHAR(products.auction_date, 'YYYY-MM-DD') as auction_date,
          TO_CHAR(products.auction_start_time, 'HH24:MI') as auction_start_time,
          TO_CHAR(products.auction_end_time, 'HH24:MI') as auction_end_time
        FROM products 
        LEFT JOIN stores ON products.store_id = stores.id 
        LEFT JOIN categories ON products.category_id = categories.id 
        WHERE products.is_active = true AND (stores.store_type IS NULL OR stores.store_type != 'topup') 
        ORDER BY products.created_at DESC`;
        let params: any[] = [];
        
        if (storeId) {
          query = `SELECT products.*, 
            wholesale_price AS bulk_price, 
            stores.store_name, 
            stores.primary_color, 
            stores.store_type, 
            categories.name as category_name,
            TO_CHAR(products.auction_date, 'YYYY-MM-DD') as auction_date,
            TO_CHAR(products.auction_start_time, 'HH24:MI') as auction_start_time,
            TO_CHAR(products.auction_end_time, 'HH24:MI') as auction_end_time
          FROM products 
          LEFT JOIN stores ON products.store_id = stores.id 
          LEFT JOIN categories ON products.category_id = categories.id 
          WHERE products.store_id = $1 AND products.is_active = true AND (stores.store_type IS NULL OR stores.store_type != 'topup') 
          ORDER BY products.created_at DESC`;
          params = [parseInt(storeId)];
          console.log(`📦 Fetching products for store ${storeId}`);
        } else {
          console.log(`📦 Fetching all products`);
        }
        
        const result = await pool.query(query, params);
        console.log(`✅ Products fetched: ${result.rows.length} items${storeId ? ` for store ${storeId}` : ''}`);
        
        // Log auction products for debugging
        result.rows.forEach((p, i) => {
          console.log(`   ${i+1}. ID:${p.id} Name:${p.name} Image:${p.image_url ? '✓' : '✗'}`);
          if (p.is_auction) {
            console.log(`       🎯 AUCTION DATA:`);
            console.log(`          auction_date: ${p.auction_date} (type: ${typeof p.auction_date})`);
            console.log(`          auction_start_time: ${p.auction_start_time}`);
            console.log(`          auction_end_time: ${p.auction_end_time}`);
            console.log(`          auction_price: ${p.auction_price}`);
          }
        });
        
        res.json(result.rows);
      } catch (error) {
        console.error('❌ Products API error:', error);
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

          console.log(`📋 GET /api/merchant/customers - StoreId: ${storeId}, Found ${result.rows.length} customers`);
          result.rows.forEach(c => {
            console.log(`   - Customer: Name="${c.name}", Phone="${c.phone}", ID=${c.id}, DB Store=${c.store_id}`);
          });

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

        // If regular store: Build customer summaries from regular-store orders only.
        const result = await pool.query(`
          SELECT 
            o.phone,
            COALESCE(
              (ARRAY_REMOVE(ARRAY_AGG(NULLIF(TRIM(o.address), '') ORDER BY o.created_at DESC), NULL))[1],
              '-'
            ) as address,
            MAX(o.created_at) as created_at,
            COUNT(*) as total_orders,
            COALESCE(SUM(o.total_amount - COALESCE(o.discount_amount, 0)), 0) as total_spent
          FROM orders o
          WHERE o.store_id = $1
            AND o.phone IS NOT NULL
            AND COALESCE(o.is_topup_order, false) = false
          GROUP BY o.phone
          ORDER BY MAX(o.created_at) DESC
        `, [parseInt(storeId)]);

        // Transform to match customer format
        const customers = result.rows.map((row: any, index: number) => ({
          customer_id: index,
          id: index,
          store_id: parseInt(storeId),
          phone: row.phone,
          address: row.address || '-',
          total_orders: parseInt(row.total_orders || 0, 10),
          total_spent: parseFloat(row.total_spent || 0),
          email: null,
          customer_type: 'cash',
          credit_limit: 0,
          current_debt: 0,
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
        // No cache for categories
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
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
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // ✅ CRITICAL: Get product data FIRST to find auction_id
        const productCheck = await pool.query("SELECT id, store_id, auction_id FROM products WHERE id = $1", [parseInt(id)]);
        
        if (productCheck.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        const product = productCheck.rows[0];
        console.log('🗑️ Deleting product:', {
          id: product.id,
          auction_id: product.auction_id
        });
        
        // ✅ If product has an auction, delete it from auctions table first
        if (product.auction_id) {
          try {
            const auctionDelete = await pool.query("DELETE FROM auctions WHERE id = $1", [product.auction_id]);
            console.log('✅ Auction deleted:', auctionDelete.rowCount, 'rows');
            await syncStoreAuctionSalesTotal(parseInt(product.store_id));
          } catch (auctionErr) {
            console.warn('⚠️ Warning: Could not delete auction:', auctionErr.message);
            // Continue with product deletion even if auction delete fails
          }
        }
        
        // ✅ Now delete the product
        const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [parseInt(id)]);
        
        console.log('✅ Product deleted successfully');
        res.json({ message: "Product deleted successfully", id: result.rows[0].id });
      } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Create product
    app.post("/api/products", async (req, res) => {
      const client = await pool.connect();
      try {
        const normalizeAuctionDateValue = (value: any) => {
          const trimmed = String(value || '').trim();
          if (!trimmed) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (slashMatch) {
            const [, day, month, year] = slashMatch;
            return `${year}-${month}-${day}`;
          }
          return trimmed;
        };

        let { store_id, category_id, name, price, stock, image_url, description, gallery = [], is_auction = false, auction_date, auction_start_time, auction_end_time, auction_price } = req.body;
        
        console.log('\n' + '='.repeat(90));
        console.log('📩 🆕 NEW PRODUCT REQUEST: POST /api/products');
        console.log('='.repeat(90));
        console.log('📨 REQUEST BODY RECEIVED:');
        console.log(JSON.stringify(req.body, null, 2));
        console.log('='.repeat(90));
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // ✅ Validate required fields
        if (!store_id || !name || price === undefined || stock === undefined) {
          console.error('❌ VALIDATION FAILED:', { store_id, name, price, stock });
          return res.status(400).json({ 
            error: `خطأ في المدخلات: ${!store_id ? 'store_id غير موجود' : !name ? 'name غير موجود' : price === undefined ? 'price غير موجود' : 'stock غير موجود'}`
          });
        }
        
        // ✅ Ensure gallery is an array and sanitize it
        if (!Array.isArray(gallery)) {
          gallery = [];
        }
        gallery = gallery.filter(item => item && typeof item === 'string');
        
        // ✅ Process main image - upload to Firebase if needed
        let finalImageUrl = image_url || null;
        if (image_url && image_url.startsWith('data:image')) {
          try {
            finalImageUrl = await uploadImageToFirebase(image_url, `main_${Date.now()}.jpg`);
            console.log('✅ Main image uploaded');
          } catch (e) {
            console.error('⚠️ Main image upload failed:', e.message);
            finalImageUrl = null;
          }
        }
        
        // ✅ Process gallery images
        const galleryUrls: string[] = [];
        for (let i = 0; i < gallery.length; i++) {
          const img = gallery[i];
          if (img && img.startsWith('data:image')) {
            try {
              const url = await uploadImageToFirebase(img, `gallery_${i}_${Date.now()}.jpg`);
              galleryUrls.push(url);
              console.log(`✅ Gallery image ${i + 1} uploaded`);
            } catch (e) {
              console.error(`⚠️ Gallery image ${i} failed`);
            }
          } else if (img) {
            galleryUrls.push(img);
          }
        }
        
        const galleryArray = galleryUrls && galleryUrls.length > 0 ? galleryUrls : null;
        
        // ✅ CRITICAL: Parse and validate auction data
        console.log('\n🎯 PARSING AUCTION DATA:');
        console.log('  Raw is_auction:', is_auction, 'Type:', typeof is_auction);
        console.log('  Raw auction_date:', auction_date);
        console.log('  Raw auction_start_time:', auction_start_time);
        console.log('  Raw auction_end_time:', auction_end_time);
        console.log('  Raw auction_price:', auction_price);
        
        // ✅ Convert is_auction to boolean properly
        let isAuctionBoolean = false;
        if (is_auction === true || is_auction === 'true' || is_auction === 1 || is_auction === '1') {
          isAuctionBoolean = true;
        }
        
        console.log('  Converted is_auction:', isAuctionBoolean);
        
        // ✅ Parse auction data if product is auction
        let parsedAuctionDate = null;
        let parsedStartTime = null;
        let parsedEndTime = null;
        let parsedPrice = null;
        
        if (isAuctionBoolean) {
          console.log('  ✅ This IS an auction product');
          
          // ✅ Validate ALL auction fields are provided (check for non-empty values)
          const hasDate = auction_date && String(auction_date).trim() !== '';
          const hasStartTime = auction_start_time && String(auction_start_time).trim() !== '';
          const hasEndTime = auction_end_time && String(auction_end_time).trim() !== '';
          const hasPrice = auction_price && String(auction_price).trim() !== '';
          
          console.log('  📋 FIELD CHECK:');
          console.log('     date present:', hasDate, '(' + JSON.stringify(auction_date) + ')');
          console.log('     start_time present:', hasStartTime, '(' + JSON.stringify(auction_start_time) + ')');
          console.log('     end_time present:', hasEndTime, '(' + JSON.stringify(auction_end_time) + ')');
          console.log('     price present:', hasPrice, '(' + JSON.stringify(auction_price) + ')');
          
          if (hasDate && hasStartTime && hasEndTime && hasPrice) {
            // Parse date - remove time part if present
            parsedAuctionDate = String(auction_date).includes('T') 
              ? String(auction_date).split('T')[0] 
              : normalizeAuctionDateValue(auction_date);
            
            // Parse times - get first 5 chars (HH:MM)
            parsedStartTime = String(auction_start_time).substring(0, 5);
            parsedEndTime = String(auction_end_time).substring(0, 5);
            
            // Parse price as number
            parsedPrice = parseFloat(String(auction_price));
            
            console.log('  ✅ AUCTION DATA VALIDATED AND WILL BE SAVED:');
            console.log('     Date: ' + parsedAuctionDate);
            console.log('     Start: ' + parsedStartTime);
            console.log('     End: ' + parsedEndTime);
            console.log('     Price: ' + parsedPrice);
          } else {
            console.warn('  ❌ AUCTION PRODUCT BUT MISSING REQUIRED FIELDS!');
            console.warn('     date:', hasDate ? '✓' : '✗ (empty)');
            console.warn('     start_time:', hasStartTime ? '✓' : '✗ (empty)');
            console.warn('     end_time:', hasEndTime ? '✓' : '✗ (empty)');
            console.warn('     price:', hasPrice ? '✓' : '✗ (empty)');
            return res.status(400).json({ error: 'بيانات المزاد غير مكتملة. يرجى إدخال التاريخ ووقت البداية ووقت النهاية والسعر الأساسي.' });
          }
        } else {
          console.log('  ℹ️ Not an auction product');
        }
        
        console.log('\n📝 INSERT VALUES:');
        console.log('  store_id: ' + store_id);
        console.log('  category_id: ' + (category_id || 'NULL'));
        console.log('  name: ' + name);
        console.log('  price: ' + price);
        console.log('  stock: ' + stock);
        console.log('  image_url: ' + (finalImageUrl ? finalImageUrl.substring(0, 50) + '...' : 'NULL'));
        console.log('  description: ' + (description ? description.substring(0, 100) : 'NULL'));
        console.log('  gallery: ' + galleryArray?.length + ' items');
        console.log('  is_auction: ' + isAuctionBoolean);
        console.log('  auction_date: ' + (parsedAuctionDate || 'NULL'));
        console.log('  auction_start_time: ' + (parsedStartTime || 'NULL'));
        console.log('  auction_end_time: ' + (parsedEndTime || 'NULL'));
        console.log('  auction_price: ' + (parsedPrice || 'NULL'));
        
        // ✅ Execute INSERT with ALL columns
        await client.query('BEGIN');

        const result = await client.query(
          `INSERT INTO products 
           (store_id, category_id, name, price, stock, image_url, description, gallery, 
            is_active, is_auction, auction_date, auction_start_time, auction_end_time, auction_price) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], true, $9, $10::date, $11::time, $12::time, $13) 
           RETURNING id, store_id, category_id, name, price, stock, image_url, description, gallery, 
                     is_active, is_auction, 
                     TO_CHAR(auction_date, 'YYYY-MM-DD') as auction_date,
                     TO_CHAR(auction_start_time, 'HH24:MI') as auction_start_time,
                     TO_CHAR(auction_end_time, 'HH24:MI') as auction_end_time,
                     auction_price, created_at`,
          [
            store_id, 
            category_id || null, 
            name, 
            price, 
            stock, 
            finalImageUrl, 
            description || null, 
            galleryArray, 
            isAuctionBoolean,
            parsedAuctionDate, 
            parsedStartTime, 
            parsedEndTime, 
            parsedPrice
          ]
        );

        const productId = result.rows[0].id;
        const savedProduct = result.rows[0];

        if (isAuctionBoolean && parsedAuctionDate && parsedStartTime && parsedEndTime && parsedPrice !== null) {
          const auctionInsert = await client.query(
            `INSERT INTO auctions (product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price, current_highest_price, status)
             VALUES ($1, $2, $3, $4, $5, $6, $6, 'active')
             RETURNING id`,
            [productId, store_id, parsedAuctionDate, parsedStartTime, parsedEndTime, parsedPrice]
          );

          await client.query(
            `UPDATE products SET auction_id = $1 WHERE id = $2`,
            [auctionInsert.rows[0].id, productId]
          );

          savedProduct.auction_id = auctionInsert.rows[0].id;
          console.log('✅ Auction row created and linked:', auctionInsert.rows[0].id);
        }

        await client.query('COMMIT');
        
        console.log('\n✅✅✅ PRODUCT CREATED SUCCESSFULLY!');
        console.log('📊 SAVED DATA:');
        console.log('  ID: ' + savedProduct.id);
        console.log('  Name: ' + savedProduct.name);
        console.log('  Price: ' + savedProduct.price);
        console.log('  Stock: ' + savedProduct.stock);
        console.log('  is_auction: ' + savedProduct.is_auction);
        console.log('  auction_date: ' + savedProduct.auction_date);
        console.log('  auction_start_time: ' + savedProduct.auction_start_time);
        console.log('  auction_end_time: ' + savedProduct.auction_end_time);
        console.log('  auction_price: ' + savedProduct.auction_price);
        console.log('='.repeat(90) + '\n');
        
        // ✅ Return the saved product to frontend
        res.json({ 
          message: 'Product created successfully',
          product: savedProduct 
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ ERROR CREATING PRODUCT:', error);
        console.error('Details:', error.message);
        res.status(500).json({ error: (error as any).message });
      } finally {
        client.release();
      }
    });

    // Update product
    app.put("/api/products/:id", async (req, res) => {
      const client = await pool.connect();
      try {
        const normalizeAuctionDateValue = (value: any) => {
          const trimmed = String(value || '').trim();
          if (!trimmed) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (slashMatch) {
            const [, day, month, year] = slashMatch;
            return `${year}-${month}-${day}`;
          }
          return trimmed;
        };

        const { id } = req.params;
        let { category_id, name, price, stock, image_url, description, gallery = [], is_auction = false,
              auction_date, auction_start_time, auction_end_time, auction_price } = req.body;
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // 🔍 DEBUG: Log incoming auction data
        console.log('🔵 PUT /api/products/:id - Incoming auction data:');
        console.log('  is_auction:', is_auction, 'type:', typeof is_auction);
        console.log('  auction_date:', auction_date, 'type:', typeof auction_date);
        console.log('  auction_start_time:', auction_start_time, 'type:', typeof auction_start_time);
        console.log('  auction_end_time:', auction_end_time, 'type:', typeof auction_end_time);
        console.log('  auction_price:', auction_price, 'type:', typeof auction_price);
        
        // Get current product to preserve existing image if not provided
        await client.query('BEGIN');

        const currentProduct = await client.query(
          "SELECT store_id, image_url, gallery, auction_id, is_auction, auction_date, auction_start_time, auction_end_time, auction_price FROM products WHERE id = $1",
          [parseInt(id)]
        );
        
        if (currentProduct.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        // Ensure gallery is an array and sanitize it
        if (!Array.isArray(gallery)) {
          gallery = [];
        }
        gallery = gallery.filter(item => item && typeof item === 'string');
        
        // Process main image - upload to Firebase if it's base64 (OPTIONAL)
        let finalImageUrl = image_url !== undefined ? image_url : currentProduct.rows[0].image_url;
        
        if (image_url && image_url.startsWith('data:image')) {
          try {
            finalImageUrl = await uploadImageToFirebase(image_url, `main_${Date.now()}.jpg`);
            console.log('✅ Main image uploaded to Firebase/Local');
          } catch (e) {
            console.error('⚠️ Main image upload failed, continuing:', e);
            // Keep existing image if upload fails
            finalImageUrl = currentProduct.rows[0].image_url;
          }
        }
        
        // Process gallery images - upload to Firebase and collect URLs (OPTIONAL)
        const galleryUrls: string[] = [];
        
        // If no new gallery provided, keep existing
        if (gallery.length === 0 && currentProduct.rows[0].gallery) {
          const existingGallery = Array.isArray(currentProduct.rows[0].gallery) 
            ? currentProduct.rows[0].gallery 
            : JSON.parse(currentProduct.rows[0].gallery || '[]');
          gallery = existingGallery;
        }
        
        for (let i = 0; i < gallery.length; i++) {
          const img = gallery[i];
          if (img && img.startsWith('data:image')) {
            try {
              const url = await uploadImageToFirebase(img, `gallery_${i}_${Date.now()}.jpg`);
              galleryUrls.push(url);
              console.log(`✅ Gallery image ${i + 1}/${gallery.length} uploaded`);
            } catch (e) {
              console.error(`⚠️ Gallery image ${i} upload failed, skipping:`, e);
              // Continue with other images
            }
          } else if (img) {
            galleryUrls.push(img); // Already a URL
          }
        }
        
        // Ensure gallery is valid array before updating
        const galleryArray = galleryUrls && galleryUrls.length > 0 ? galleryUrls : null;
        
        // ✅ CRITICAL: Preserve existing auction data if not being updated
        // Get current auction data from database
        const currentAuctionData = currentProduct.rows[0];
        
        // ✅ Convert database Date objects to strings for proper handling
        let currentDateStr = '';
        if (currentAuctionData.auction_date) {
          const dateObj = new Date(currentAuctionData.auction_date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          currentDateStr = `${year}-${month}-${day}`;
        }
        
        let currentStartTimeStr = '';
        if (currentAuctionData.auction_start_time) {
          currentStartTimeStr = String(currentAuctionData.auction_start_time);
          if (currentStartTimeStr.length > 5) {
            currentStartTimeStr = currentStartTimeStr.slice(0, 5);
          }
        }
        
        let currentEndTimeStr = '';
        if (currentAuctionData.auction_end_time) {
          currentEndTimeStr = String(currentAuctionData.auction_end_time);
          if (currentEndTimeStr.length > 5) {
            currentEndTimeStr = currentEndTimeStr.slice(0, 5);
          }
        }
        
        let currentPriceStr = String(currentAuctionData.auction_price || '');
        
        console.log('🔵 CURRENT DATA FROM DB (converted to strings):');
        console.log('  currentDateStr:', currentDateStr);
        console.log('  currentStartTimeStr:', currentStartTimeStr);
        console.log('  currentEndTimeStr:', currentEndTimeStr);
        console.log('  currentPriceStr:', currentPriceStr);
        
        // Parse auction data if provided, otherwise preserve existing
        let parsedAuctionDate = currentDateStr; // Preserve existing
        let parsedStartTime = currentStartTimeStr; // Preserve existing
        let parsedEndTime = currentEndTimeStr; // Preserve existing
        let parsedPrice = currentPriceStr; // Preserve existing
        
        // Determine effective is_auction value
        let effectiveIsAuction = is_auction === true || is_auction === 'true' ? true : 
                                  is_auction === false || is_auction === 'false' ? false : 
                                  currentAuctionData.is_auction;
        
        console.log('🔵 PUT AUCTION LOGIC:');
        console.log('  Current is_auction:', currentAuctionData.is_auction);
        console.log('  Incoming is_auction:', is_auction);
        console.log('  Effective is_auction:', effectiveIsAuction);
        console.log('');
        console.log('🔵 INCOMING AUCTION DATA (NEW VALUES):');
        console.log('  auction_date:', auction_date, '(trimmed: "' + String(auction_date || '').trim() + '")');
        console.log('  auction_start_time:', auction_start_time, '(trimmed: "' + String(auction_start_time || '').trim() + '")');
        console.log('  auction_end_time:', auction_end_time, '(trimmed: "' + String(auction_end_time || '').trim() + '")');
        console.log('  auction_price:', auction_price, '(trimmed: "' + String(auction_price || '').trim() + '")');
        
        // ✅ Trim and normalize incoming data
        const incomingDate = normalizeAuctionDateValue(auction_date);
        const incomingStartTime = String(auction_start_time || '').trim();
        const incomingEndTime = String(auction_end_time || '').trim();
        const incomingPrice = String(auction_price || '').trim();
        
        const hasNewAuctionData = incomingDate && incomingStartTime && incomingEndTime && incomingPrice;
        
        console.log('');
        console.log('📋 TRIMMED INCOMING DATA:');
        console.log('  Has all auction data:', hasNewAuctionData);
        console.log('  incomingDate:', incomingDate);
        console.log('  incomingStartTime:', incomingStartTime);
        console.log('  incomingEndTime:', incomingEndTime);
        console.log('  incomingPrice:', incomingPrice);
        
        // Update auction data based on is_auction flag
        if (effectiveIsAuction === true) {
          // This is (or will be) an auction product
          if (hasNewAuctionData) {
            // User provided new auction data - update it
            parsedAuctionDate = incomingDate.split('T')[0];
            parsedStartTime = incomingStartTime.slice(0, 5);
            parsedEndTime = incomingEndTime.slice(0, 5);
            parsedPrice = parseFloat(incomingPrice) || 0; // Convert to number
            
            console.log('✅ UPDATING TO NEW AUCTION DATA:');
            console.log('   New Date:', parsedAuctionDate);
            console.log('   New Times:', parsedStartTime, '-', parsedEndTime);
            console.log('   New Price:', parsedPrice);
          } else {
            // User didn't provide new auction data but is_auction is true
            // Keep existing data (already set above)
            // Convert string price back to number if needed
            if (parsedPrice) {
              parsedPrice = parseFloat(parsedPrice) || 0;
            }
            console.log('✅ PRESERVING EXISTING AUCTION DATA (is_auction=true but no new data)');
            console.log('   Current Date:', parsedAuctionDate);
            console.log('   Current Times:', parsedStartTime, '-', parsedEndTime);
            console.log('   Current Price:', parsedPrice, '(type: ' + typeof parsedPrice + ')');
          }
        } else {
          // is_auction is false - clear all auction data
          parsedAuctionDate = null;
          parsedStartTime = null;
          parsedEndTime = null;
          parsedPrice = null;
          console.log('✅ CLEARING AUCTION DATA (is_auction=false)');
        }
        
        console.log('');
        console.log('📝 FINAL VALUES TO BE SAVED:');
        console.log('  parsedAuctionDate:', parsedAuctionDate, '(type:', typeof parsedAuctionDate + ')');
        console.log('  parsedStartTime:', parsedStartTime);
        console.log('  parsedEndTime:', parsedEndTime);
        console.log('  parsedPrice:', parsedPrice, '(type:', typeof parsedPrice + ')');
        console.log('');
        
        const result = await client.query(
          `UPDATE products SET category_id = $1, name = $2, price = $3, stock = $4, image_url = $5, description = $6, gallery = $7::text[], is_auction = $8, 
                              auction_date = NULLIF($9, '')::date, 
                              auction_start_time = NULLIF($10, '')::time, 
                              auction_end_time = NULLIF($11, '')::time, 
                              auction_price = NULLIF($12, '')::numeric 
           WHERE id = $13 
           RETURNING id, store_id, category_id, name, price, stock, image_url, description, gallery, is_active, is_auction,
                     TO_CHAR(auction_date, 'YYYY-MM-DD') as auction_date,
                     TO_CHAR(auction_start_time, 'HH24:MI') as auction_start_time,
                     TO_CHAR(auction_end_time, 'HH24:MI') as auction_end_time,
                     auction_price, created_at`,
          [category_id || null, name, price, stock, finalImageUrl, description, galleryArray, effectiveIsAuction, parsedAuctionDate, parsedStartTime, parsedEndTime, parsedPrice, parseInt(id)]
        );

        const currentAuctionId = currentAuctionData.auction_id;
        const storeId = currentAuctionData.store_id;
        const hasCompleteAuctionValues = !!(parsedAuctionDate && parsedStartTime && parsedEndTime && parsedPrice !== null);
        let shouldSyncAuctionSales = false;

        if (effectiveIsAuction === true && hasCompleteAuctionValues) {
          if (currentAuctionId) {
            await client.query(
              `UPDATE auctions
               SET auction_date = $1,
                   auction_start_time = $2,
                   auction_end_time = $3,
                   starting_price = $4,
                   current_highest_price = CASE
                     WHEN current_highest_price IS NULL OR current_highest_price = 0 THEN $4
                     WHEN current_highest_price < $4 THEN $4
                     ELSE current_highest_price
                   END,
                   status = 'active'
               WHERE id = $5`,
              [parsedAuctionDate, parsedStartTime, parsedEndTime, parsedPrice, currentAuctionId]
            );
            console.log('✅ Auction row updated:', currentAuctionId);
          } else {
            const auctionInsert = await client.query(
              `INSERT INTO auctions (product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price, current_highest_price, status)
               VALUES ($1, $2, $3, $4, $5, $6, $6, 'active')
               RETURNING id`,
              [parseInt(id), storeId, parsedAuctionDate, parsedStartTime, parsedEndTime, parsedPrice]
            );

            await client.query(
              `UPDATE products SET auction_id = $1 WHERE id = $2`,
              [auctionInsert.rows[0].id, parseInt(id)]
            );
            result.rows[0].auction_id = auctionInsert.rows[0].id;
            console.log('✅ Auction row created during update:', auctionInsert.rows[0].id);
          }
        } else if (effectiveIsAuction === false && currentAuctionId) {
          await client.query(`DELETE FROM auctions WHERE id = $1`, [currentAuctionId]);
          await client.query(`UPDATE products SET auction_id = NULL WHERE id = $1`, [parseInt(id)]);
          result.rows[0].auction_id = null;
          shouldSyncAuctionSales = true;
          console.log('✅ Auction row deleted during product update:', currentAuctionId);
        }

        await client.query('COMMIT');

        if (shouldSyncAuctionSales) {
          await syncStoreAuctionSalesTotal(parseInt(storeId));
        }
        
        console.log('✅✅✅ Product updated:');
        console.log('  - Product ID:', id);
        console.log('  - is_auction (saved):', result.rows[0].is_auction);
        console.log('  - auction_date (saved):', result.rows[0].auction_date);
        console.log('  - auction_start_time (saved):', result.rows[0].auction_start_time);
        console.log('  - auction_end_time (saved):', result.rows[0].auction_end_time);
        console.log('  - auction_price (saved):', result.rows[0].auction_price);
        
        // ✅ Convert dates to strings before sending response (same as GET endpoint)
        const responseProduct = result.rows[0];
        if (responseProduct.auction_date) {
          responseProduct.auction_date = new Date(responseProduct.auction_date).toISOString().split('T')[0];
        }
        if (responseProduct.auction_start_time) {
          const timeStr = String(responseProduct.auction_start_time);
          responseProduct.auction_start_time = timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
        }
        if (responseProduct.auction_end_time) {
          const timeStr = String(responseProduct.auction_end_time);
          responseProduct.auction_end_time = timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
        }
        
        res.json({ 
          message: 'Product updated successfully',
          product: responseProduct
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating product:', error);
        res.status(500).json({ error: (error as any).message });
      } finally {
        client.release();
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
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
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
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
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
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
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
          "UPDATE stores SET is_active = $1, status = $2 WHERE id = $3 RETURNING *",
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
          "UPDATE stores SET logo_url = $1 WHERE id = $2 RETURNING *",
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
          "UPDATE stores SET subscription_paid = $1 WHERE id = $2 RETURNING *",
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
        const { store_id, name, phone, password, credit_limit, starting_balance } = req.body;
        
        if (!store_id || !name || !phone) {
          return res.status(400).json({ error: "store_id, name, and phone are required" });
        }

        // Check that this is a topup store
        const storeCheck = await pool.query("SELECT store_type FROM stores WHERE id = $1", [store_id]);
        if (storeCheck.rows.length === 0 || storeCheck.rows[0].store_type !== 'topup') {
          return res.status(403).json({ error: "فقط متاجر الشحن يمكنها إضافة عملاء" });
        }

        const result = await pool.query(
          `INSERT INTO customers (store_id, name, phone, password, credit_limit, starting_balance, current_debt, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $6, true)
           RETURNING id, store_id, name, phone, password, credit_limit, starting_balance, current_debt, is_active, created_at`,
          [store_id, name.toString().trim(), phone.toString().trim(), password || null, credit_limit || 0, starting_balance || 0]
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
        const { name, phone, password, is_active, starting_balance, credit_limit, notes } = req.body;

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
          values.push(name.toString().trim());
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramCount++}`);
          values.push(phone.toString().trim());
        }
        if (password !== undefined) {
          updates.push(`password = $${paramCount++}`);
          values.push(password);
        }
        if (credit_limit !== undefined) {
          updates.push(`credit_limit = $${paramCount++}`);
          values.push(credit_limit);
        }
        if (starting_balance !== undefined) {
          updates.push(`starting_balance = $${paramCount++}`);
          values.push(starting_balance);
        }
        if (notes !== undefined) {
          updates.push(`notes = $${paramCount++}`);
          values.push(notes);
        }
        if (is_active !== undefined) {
          updates.push(`is_active = $${paramCount++}`);
          values.push(is_active);
        }

        values.push(parseInt(id));

        const result = await pool.query(
          `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, store_id, name, phone, password, credit_limit, current_debt, starting_balance, notes, is_active, created_at`,
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

    // Legacy customer delete route is disabled for safety.
    app.delete("/api/customers/:id", async (req, res) => {
      try {
        return res.status(403).json({
          error: "تم إيقاف هذا المسار لحماية بيانات الطلبات. استخدم مسار عملاء الشحن المخصص فقط."
        });
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
          `SELECT id, name, phone, starting_balance, created_at 
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

        console.log('🔐 /api/topup/auth received:', { phone, store_id, passwordLength: password?.length });

        if (!phone || !password || !store_id) {
          return res.status(400).json({ error: "رقم الهاتف وكلمة المرور ومعرف المتجر مطلوبة" });
        }

        // Check if customer exists in the registered customers list for this topup store
        const customerResult = await pool.query(
          `SELECT id as customer_id, store_id, name, phone, customer_type, credit_limit, current_debt, password, is_active
           FROM customers 
           WHERE store_id = $1 AND phone = $2
           LIMIT 1`,
          [parseInt(store_id), phone]
        );

        console.log('🔐 Customer lookup result:', { 
          found: customerResult.rows.length > 0, 
          store_id, 
          phone,
          rows: customerResult.rows.length 
        });

        if (customerResult.rows.length === 0) {
          return res.status(403).json({ 
            error: `❌ عذراً، رقم الهاتف ${phone} غير مسجل في المتجر #${store_id}. يرجى التواصل مع المتجر للتسجيل.` 
          });
        }

        const customer = customerResult.rows[0];

        console.log('🔐 Customer found:', { 
          name: customer.name, 
          is_active: customer.is_active,
          has_password: !!customer.password,
          stored_password: customer.password 
        });

        if (!customer.is_active) {
          return res.status(403).json({ 
            error: "❌ حسابك غير مفعّل. يرجى التواصل مع المتجر." 
          });
        }

        // Verify password matches
        if (!customer.password || customer.password !== password) {
          console.log('🔐 Password mismatch:', { provided: password, stored: customer.password, match: customer.password === password });
          return res.status(403).json({ 
            error: `❌ كلمة المرور غير صحيحة للرقم ${phone}. يرجى المحاولة مرة أخرى.` 
          });
        }
        
        console.log('✅ Auth successful for:', customer.name);
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
        console.error('❌ /api/topup/auth error:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get topup customers
    app.get("/api/topup/customers/:storeId", async (req, res) => {
      try {
        const { storeId } = req.params;
        
        const result = await pool.query(
          `SELECT id, store_id, name, phone, password, customer_type, COALESCE(credit_limit, 0) as credit_limit, COALESCE(starting_balance, 0) as starting_balance, notes, is_active, created_at
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
        const { store_id, name, phone, password, customer_type, credit_limit, starting_balance, notes } = req.body;
        
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
          `INSERT INTO customers (store_id, name, phone, password, customer_type, credit_limit, starting_balance, current_debt, notes, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, true)
           RETURNING id, store_id, name, phone, password, customer_type, credit_limit, current_debt, starting_balance, notes, is_active, created_at`,
          [store_id, name, phone, password, customer_type || 'cash', credit_limit || 0, starting_balance || 0, notes || '']
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
        const { name, phone, password, customer_type, credit_limit, starting_balance, notes } = req.body;
        
        console.log(`📝 UPDATE CUSTOMER ${id}:`);
        console.log(`   Received name: "${name}"`);
        console.log(`   Received phone: "${phone}"`);
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name.toString().trim());
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramCount++}`);
          values.push(phone.toString().trim());
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
        if (notes !== undefined) {
          updates.push(`notes = $${paramCount++}`);
          values.push(notes);
        }
        
        values.push(id);
        
        const result = await pool.query(
          `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, store_id, name, phone, password, customer_type, credit_limit, current_debt, starting_balance, notes, is_active, created_at`,
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
        
        // Soft delete to preserve purchase/payment history integrity.
        const result = await pool.query(
          `UPDATE customers
           SET is_active = false
           WHERE id = $1
           RETURNING id`,
          [customerId]
        );

        console.log(`✅ [DELETE TOPUP] Customer deactivated safely: ${customer.name} (${customer.phone}) - ID: ${customerId}`);

        res.json({ success: true, message: "تم تعطيل العميل بنجاح دون المساس بسجل الشراء", customer: { id: customerId, name: customer.name } });
      } catch (error) {
        console.error(`❌ [DELETE TOPUP] Error:`, error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get customer statement (transactions) - TOPUP STORE ONLY
    // ⚠️ IMPORTANT: This endpoint is EXCLUSIVELY for topup store customers
    // It queries topup_orders table (NOT orders table) to avoid mixing with regular store orders
    app.get("/api/topup/customers/:customerId/statement", async (req, res) => {
      try {
        const { customerId } = req.params;
        
        // ⭐ Validate customer ID format
        const customerIdNum = parseInt(customerId);
        if (isNaN(customerIdNum) || customerIdNum <= 0) {
          console.error(`❌ [STATEMENT] Invalid customer ID format: ${customerId}`);
          return res.status(400).json({ error: "Invalid customer ID format" });
        }
        
        // ⚠️ CRITICAL: Disable all caching for dynamic data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        console.log(`\n📊 [STATEMENT] Fetching statement for customer ID: ${customerIdNum}`);
        
        // Get customer info
        const customerResult = await pool.query(
          `SELECT id, name, phone, created_at, starting_balance, current_debt, credit_limit
           FROM customers WHERE id = $1`,
          [customerIdNum]
        );
        
        if (customerResult.rows.length === 0) {
          console.log(`❌ [STATEMENT] Customer ${customerIdNum} not found`);
          return res.status(404).json({ error: "Customer not found" });
        }
        
        const customer = customerResult.rows[0];
        
        // ⭐ Double-check: Verify returned customer matches requested ID
        if (customer.id !== customerIdNum) {
          console.error(`❌ [STATEMENT] SECURITY ERROR: Requested customer ${customerIdNum}, but got ${customer.id}`);
          return res.status(500).json({ error: "Data integrity error" });
        }
        
        console.log(`✅ [STATEMENT] Customer found: ${customer.name} (verified ID: ${customer.id})`);
        console.log(`   🔍 Customer data:`, {
          id: customer.id,
          starting_balance: customer.starting_balance,
          current_debt: customer.current_debt,
          credit_limit: customer.credit_limit
        });
        
        // Validate required fields
        if (!customer.id) {
          throw new Error('Customer ID is missing');
        }
        
        // ✅ Calculate opening balance
        // Opening balance is just the starting_balance - it never changes!
        // It represents the initial capital/credit given to customer
        const openingBalance = Number(customer.starting_balance) || 0;
        
        console.log(`📊 [STATEMENT] Opening balance calculation:`);
        console.log(`   Starting balance (immutable): ${openingBalance} د.ع`);
        
        console.log(`📊 [STATEMENT] Opening balance calculation:`);
        console.log(`   Starting balance (immutable): ${openingBalance} د.ع`);
        
        // Get customer's topup orders (purchases/debits) from TOPUP_ORDERS table
        // ⚠️ IMPORTANT: Use topup_orders ONLY - not orders table!
        // orders table is for regular store customers, topup_orders is for topup store customers
        let ordersResult = { rows: [] };
        try {
          ordersResult = await pool.query(
            `SELECT 
              o.id, o.customer_id, o.total_amount,
              o.status, o.created_at
             FROM topup_orders o
             WHERE o.customer_id = $1
             ORDER BY o.created_at ASC`,
            [customerIdNum]
          );
          console.log(`📦 [STATEMENT] Topup Orders query - Customer: ${customerIdNum}, Found: ${ordersResult.rows.length}`);
        } catch (e) {
          console.warn(`⚠️ [STATEMENT] Topup Orders query failed (table may not exist):`, (e as any).message);
          ordersResult = { rows: [] };
        }
        
        // Get customer's payments (credits)
        let paymentsResult = { rows: [] };
        try {
          paymentsResult = await pool.query(
            `SELECT id, customer_id, amount, payment_method, created_at
             FROM customer_payments WHERE customer_id = $1
             ORDER BY created_at ASC`,
            [customerIdNum]
          );
          console.log(`💳 [STATEMENT] Payments query - Customer: ${customerIdNum}, Found: ${paymentsResult.rows.length}`);
          
          // ⭐ Verify all returned payments belong to this customer
          const wrongPayments = paymentsResult.rows.filter(p => p.customer_id !== customerIdNum);
          if (wrongPayments.length > 0) {
            console.error(`❌ [STATEMENT] SECURITY ERROR: Found ${wrongPayments.length} payments for different customers!`);
            wrongPayments.forEach(p => console.error(`   ❌ Payment ID ${p.id}: customer_id = ${p.customer_id}, expected ${customerIdNum}`));
          }
        } catch (e) {
          console.warn(`⚠️ [STATEMENT] Payments query failed (table may not exist):`, (e as any).message);
          paymentsResult = { rows: [] };
        }
        
        // Combine all transactions and build statement
        const allItems = [
          ...ordersResult.rows.map(o => ({
            id: o.id,
            created_at: o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at),
            type: 'topup',
            description: `شراء - ${o.total_amount || 0} د.ع`,
            amount: Number(o.total_amount || 0),
            is_payment: false,
            source: 'topup_order'
          })),
          ...paymentsResult.rows.map(p => ({
            id: p.id,
            created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
            type: 'payment',
            description: 'دفعة',
            amount: Number(p.amount || 0),
            is_payment: true,
            source: 'payment'
          }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // DON'T add opening balance to allItems - handle separately below
        
        // Separate opening balance (IMMUTABLE) from other transactions
        const openingBalanceRow = {
          id: 0,
          created_at: customer.created_at instanceof Date ? customer.created_at.toISOString() : String(customer.created_at),
          type: 'opening',
          description: 'ديون سابقة',
          amount: openingBalance,
          is_payment: false,
          source: 'opening',
          balance: openingBalance  // FIXED - never changes!
        };
        
        // Sort transactions chronologically (exclude opening balance)
        const otherTransactions = allItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // Calculate running balance for OTHER transactions starting from opening balance
        let runningBalance = openingBalance;
        const otherTransactionsWithBalance = otherTransactions.map((item) => {
          try {
            if (item.is_payment) {
              runningBalance -= Number(item.amount || 0);  // Payment REDUCES debt (balance goes down)
            } else {
              runningBalance += Number(item.amount || 0);  // Purchase INCREASES debt (balance goes up)
            }
            return { 
              ...item, 
              balance: Math.max(0, runningBalance),
              amount: Number(item.amount || 0)
            };
          } catch (e) {
            console.error('Error processing item:', item, e);
            return { ...item, balance: 0, amount: 0 };
          }
        });
        
        // Combine: other transactions in REVERSE order (newest first), opening balance LAST (always at bottom)
        const transactions = [...otherTransactionsWithBalance.reverse(), openingBalanceRow];
        
        // Calculate final current balance
        const finalBalance = otherTransactionsWithBalance.length > 0 
          ? otherTransactionsWithBalance[otherTransactionsWithBalance.length - 1].balance 
          : openingBalance;
        
        console.log(`📊 [STATEMENT] Final: ${transactions.length} transactions, final balance: ${finalBalance} د.ع`);
        console.log(`📊 [STATEMENT] Database current_debt: ${customer.current_debt}, Calculated finalBalance: ${finalBalance}`);
        
        res.json({
          customer: {
            id: customer.id || 0,
            name: customer.name || '',
            phone: customer.phone || '',
            credit_limit: Number(customer.credit_limit) || 0,
            current_debt: Number(finalBalance) || 0,
            starting_balance: Number(customer.starting_balance) || 0
          },
          transactions: Array.isArray(transactions) ? transactions : [],
          current_debt: Number(finalBalance) || 0,
          credit_limit: Number(customer.credit_limit) || 0,
          starting_balance: Number(customer.starting_balance) || 0
        });
      } catch (error) {
        const errorMsg = (error as any).message || 'Unknown error';
        const errorCode = (error as any).code || 'UNKNOWN';
        const errorDetail = (error as any).detail || '';
        
        console.error('❌ Statement error:', errorMsg);
        console.error('   Code:', errorCode);
        console.error('   Detail:', errorDetail);
        console.error('   Stack:', (error as any).stack);
        
        // Return different error messages based on the type of error
        let userMessage = 'حدث خطأ في تحميل كشف الحساب';
        if (errorCode === '42P01') {
          userMessage = 'جدول غير موجود في قاعدة البيانات';
        } else if (errorCode === '42703') {
          userMessage = 'عمود غير موجود في الجدول';
        }
        
        res.status(500).json({ 
          error: userMessage,
          details: errorMsg
        });
      }
    });

    // Topup Payment - Reduce starting_balance or current_debt
    app.post("/api/topup/payment", async (req, res) => {
      try {
        // ⚠️ CRITICAL: Disable all caching for this endpoint
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        const { customer_id, store_id, amount } = req.body;
        
        console.log(`💳 [PAYMENT REQUEST] Customer: ${customer_id}, Amount: ${amount}, Store: ${store_id}`);
        
        if (!customer_id || !store_id || !amount || amount <= 0) {
          return res.status(400).json({ error: "customer_id, store_id, and amount are required" });
        }

        // Get customer info to verify they exist
        const customerResult = await pool.query(
          `SELECT id, starting_balance, current_debt, credit_limit FROM customers WHERE id = $1`,
          [customer_id]
        );

        if (customerResult.rows.length === 0) {
          console.log(`❌ [PAYMENT] Customer ${customer_id} not found`);
          return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customerResult.rows[0];
        const currentDebt = parseFloat(customer.current_debt || 0);
        
        console.log(`💳 [PAYMENT CHECK] Customer: ${customer_id}, CurrentDebt: ${currentDebt}, PaymentAmount: ${amount}`);
        
        // Validate payment doesn't exceed current debt
        if (currentDebt <= 0) {
          console.log(`❌ [PAYMENT] Customer has no debt: ${currentDebt}`);
          return res.status(400).json({ error: `العميل لا يوجد لديه ديون (الديون الحالية: ${currentDebt} د.ع)` });
        }
        
        if (amount > currentDebt) {
          console.log(`❌ [PAYMENT] Amount exceeds debt: ${amount} > ${currentDebt}`);
          return res.status(400).json({ error: `المبلغ المدخل (${amount} د.ع) أكبر من الديون الحالية (${currentDebt} د.ع)` });
        }

        // ✅ Update customer's current_debt ONLY
        // ⭐ IMPORTANT: starting_balance (الديون السابقة) is IMMUTABLE and must never change
        await pool.query(
          `UPDATE customers SET 
            current_debt = current_debt - $1
           WHERE id = $2`,
          [amount, customer_id]
        );

        // ✅ Insert payment record into customer_payments table
        // so it appears in the statement endpoint's transaction list
        try {
          console.log(`💾 [PAYMENT] Attempting to insert: customer_id=${customer_id}, amount=${amount}, store_id=${store_id}`);
          const paymentRes = await pool.query(
            `INSERT INTO customer_payments (customer_id, store_id, amount, payment_method, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id`,
            [customer_id, store_id, amount, 'online', 'تسديد ديون من خلال متجر الشحن']
          );
          console.log(`✅ [PAYMENT] Recorded in customer_payments table - payment ID: ${paymentRes.rows[0]?.id}`);
        } catch (dbErr: any) {
          console.error(`❌ [PAYMENT] ERROR inserting payment:`, {
            code: dbErr.code,
            message: dbErr.message,
            detail: dbErr.detail,
            column: dbErr.column
          });
          throw new Error("Failed to record payment");
        }

        console.log(`💳 [TOPUP PAYMENT] Customer: ${customer_id} - Amount: ${amount} د.ع - Payment recorded successfully`);
        
        // Fetch updated customer data
        const updatedCustomer = await pool.query(
          `SELECT id, starting_balance, current_debt, credit_limit FROM customers WHERE id = $1`,
          [customer_id]
        );
        
        const customerData = updatedCustomer.rows[0];
        console.log(`✅ [PAYMENT RESPONSE] Returning customer data:`, {
          id: customerData.id,
          starting_balance: customerData.starting_balance,
          current_debt: customerData.current_debt,
          credit_limit: customerData.credit_limit
        });
        
        res.json({ 
          success: true, 
          message: "تم تسديد المبلغ بنجاح",
          amount: amount,
          customer: customerData
        });
      } catch (error) {
        console.error("❌ Payment error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Delete payment
    app.delete("/api/topup/payment/:paymentId", async (req, res) => {
      try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const { paymentId } = req.params;
        
        console.log(`🗑️ [DELETE PAYMENT] Attempting to delete payment: ${paymentId}`);
        
        // Get payment details first
        const paymentRes = await pool.query(
          `SELECT customer_id, store_id, amount FROM customer_payments WHERE id = $1`,
          [paymentId]
        );
        
        if (paymentRes.rows.length === 0) {
          console.log(`❌ [DELETE PAYMENT] Payment not found: ${paymentId}`);
          return res.status(404).json({ error: "Payment not found" });
        }
        
        const payment = paymentRes.rows[0];
        
        // Update customer's current_debt ONLY (reverse the payment)
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        await pool.query(
          `UPDATE customers SET 
            current_debt = current_debt + $1
           WHERE id = $2`,
          [payment.amount, payment.customer_id]
        );
        
        // Delete the payment
        const deleteRes = await pool.query(
          `DELETE FROM customer_payments WHERE id = $1 RETURNING id`,
          [paymentId]
        );
        
        if (deleteRes.rows.length === 0) {
          return res.status(500).json({ error: "Failed to delete payment" });
        }
        
        // Fetch updated customer data
        const updatedCustomer = await pool.query(
          `SELECT id, starting_balance, current_debt, credit_limit FROM customers WHERE id = $1`,
          [payment.customer_id]
        );
        
        console.log(`✅ [DELETE PAYMENT] Payment deleted successfully. Customer: ${payment.customer_id}, Deleted amount: ${payment.amount} د.ع`);
        
        res.json({ 
          success: true, 
          message: "تم حذف التسديد بنجاح",
          customer: updatedCustomer.rows[0]
        });
      } catch (error) {
        console.error("❌ Delete payment error:", error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ✏️ Edit/Update Payment
    app.put("/api/topup/payment/:paymentId", async (req, res) => {
      try {
        const { paymentId } = req.params;
        const { newAmount } = req.body;
        
        if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
          return res.status(400).json({ error: "Invalid amount" });
        }
        
        // Get current payment details
        const paymentResult = await pool.query(
          `SELECT id, customer_id, amount FROM customer_payments WHERE id = $1`,
          [paymentId]
        );
        
        if (paymentResult.rows.length === 0) {
          return res.status(404).json({ error: "Payment not found" });
        }
        
        const payment = paymentResult.rows[0];
        const oldAmount = Number(payment.amount);
        const amountDifference = Number(newAmount) - oldAmount;
        
        // If amounts differ, adjust customer_debt ONLY
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        if (amountDifference !== 0) {
          await pool.query(
            `UPDATE customers SET 
              current_debt = current_debt - $1
             WHERE id = $2`,
            [amountDifference, payment.customer_id]
          );
        }
        
        // Update payment amount
        await pool.query(
          `UPDATE customer_payments SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [newAmount, paymentId]
        );
        
        // Fetch updated customer data
        const updatedCustomer = await pool.query(
          `SELECT id, starting_balance, current_debt, credit_limit FROM customers WHERE id = $1`,
          [payment.customer_id]
        );
        
        console.log(`✏️ [EDIT PAYMENT] Payment ${paymentId} updated. Customer: ${payment.customer_id}, Old amount: ${oldAmount}, New amount: ${newAmount}, Difference: ${amountDifference} د.ع`);
        
        res.json({ 
          success: true, 
          message: "تم تحديث التسديد بنجاح",
          payment: {
            id: paymentId,
            amount: newAmount
          },
          customer: updatedCustomer.rows[0]
        });
      } catch (error) {
        console.error("❌ Edit payment error:", error);
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

    // DEBUG: Check stores mismatch between DB and API
    app.get("/api/debug/stores-mismatch", async (req, res) => {
      try {
        console.log("\n🔍 DEBUG STORES MISMATCH CHECK");
        
        // Get ALL stores from database (regardless of is_active)
        const allStoresResult = await pool.query(`
          SELECT id, store_name, owner_id, owner_name, owner_phone, is_active, status, slug, created_at 
          FROM stores 
          ORDER BY id DESC
        `);
        
        // Get active stores (what API returns)
        const activeStoresResult = await pool.query(`
          SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone
          FROM stores
          WHERE is_active = true
          ORDER BY created_at DESC
        `);
        
        // Get stores with their user info
        const storesWithUsersResult = await pool.query(`
          SELECT s.id, s.store_name, s.owner_id, s.owner_name, s.owner_phone, s.is_active, s.status,
                 u.id as user_id, u.name as user_name, u.phone as user_phone, u.role
          FROM stores s
          LEFT JOIN users u ON s.owner_id = u.id
          ORDER BY s.id DESC
        `);
        
        console.log(`📊 ALL stores in DB: ${allStoresResult.rows.length}`);
        allStoresResult.rows.forEach((s: any) => {
          console.log(`   [${s.id}] ${s.store_name} (is_active: ${s.is_active}, status: ${s.status}, owner_id: ${s.owner_id})`);
        });
        
        console.log(`\n📊 ACTIVE stores (is_active=true): ${activeStoresResult.rows.length}`);
        activeStoresResult.rows.forEach((s: any) => {
          console.log(`   [${s.id}] ${s.store_name} (owner_name: ${s.owner_name}, owner_phone: ${s.owner_phone})`);
        });
        
        console.log(`\n📊 Stores with user info: ${storesWithUsersResult.rows.length}`);
        storesWithUsersResult.rows.forEach((s: any) => {
          console.log(`   [${s.id}] ${s.store_name} - Owner: ${s.owner_id} (${s.user_name}/${s.user_phone})`);
        });
        
        res.json({
          allStoresCount: allStoresResult.rows.length,
          allStores: allStoresResult.rows,
          activeStoresCount: activeStoresResult.rows.length,
          activeStores: activeStoresResult.rows,
          storesWithUsersCount: storesWithUsersResult.rows.length,
          storesWithUsers: storesWithUsersResult.rows,
          mismatchDetected: allStoresResult.rows.length !== activeStoresResult.rows.length,
          mismatchReason: allStoresResult.rows.length > activeStoresResult.rows.length ? 
            'Some stores have is_active=false' : 
            'No mismatch detected'
        });
      } catch (error) {
        console.error("Stores mismatch debug error:", error);
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
        // Use store_id from query, default to 13 (topup store)
        let storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 13;
        
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
        let { storeId } = req.params;
        
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

    // Create topup company - LOGO FIX: Compress and store Base64
    app.post("/api/topup/companies", async (req, res) => {
      try {
        let { store_id, name, logo_url } = req.body;
        
        console.log('\n📦 POST /api/topup/companies');
        console.log('   Payload:', { store_id, name, has_logo: !!logo_url });
        
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          console.warn('❌ Invalid name');
          return res.status(400).json({ error: "Company name is required" });
        }
        
        name = name.trim();
        
        // ✅ LOGO FIX: Compress and process logo for company
        let processedLogo = logo_url;
        
        if (logo_url && logo_url.startsWith('data:image')) {
          try {
            console.log('   🎨 Processing company logo for storage...');
            
            const base64Data = logo_url.replace(/^data:image\/[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            console.log(`     Original size: ${(buffer.length / 1024).toFixed(2)} KB`);
            
            // Compress if larger than 200KB
            if (buffer.length > 200 * 1024) {
              console.log('     Compressing logo...');
              const compressedBuffer = await sharp(buffer)
                .resize(150, 150, { fit: 'contain', withoutEnlargement: true })
                .png({ quality: 80 })
                .toBuffer();
              
              console.log(`     ✅ Compressed: ${(compressedBuffer.length / 1024).toFixed(2)} KB`);
              processedLogo = 'data:image/png;base64,' + compressedBuffer.toString('base64');
            }
          } catch (compressErr) {
            console.warn('     ⚠️  Logo compression warning:', (compressErr as any).message);
          }
        }
        
        // Set cache headers
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // CRITICAL: Always find a valid store that actually exists in the database
        let finalStoreId = null;
        
        // Step 1: If store_id provided, verify it exists first
        if (store_id) {
          const providedStoreId = parseInt(store_id);
          if (!isNaN(providedStoreId)) {
            const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [providedStoreId]);
            if (storeCheck.rows.length > 0) {
              finalStoreId = providedStoreId;
              console.log(`   ✅ Using provided store ID: ${finalStoreId}`);
            } else {
              console.log(`   ⚠️  Provided store ID ${providedStoreId} does not exist, searching for alternative...`);
            }
          }
        }
        
        // Step 2: If store_id not valid, find first topup store
        if (!finalStoreId) {
          console.log('   🔍 Finding topup store...');
          const topupStores = await pool.query(
            'SELECT id FROM stores WHERE store_type = $1 LIMIT 1',
            ['topup']
          );
          
          if (topupStores.rows.length > 0) {
            finalStoreId = topupStores.rows[0].id;
            console.log(`   ✅ Found topup store: ${finalStoreId}`);
          }
        }
        
        // Step 3: If still no store, find ANY store
        if (!finalStoreId) {
          console.log('   🔍 Finding any available store...');
          const anyStore = await pool.query('SELECT id FROM stores LIMIT 1');
          
          if (anyStore.rows.length > 0) {
            finalStoreId = anyStore.rows[0].id;
            console.log(`   ⚠️  Using first available store: ${finalStoreId}`);
          } else {
            console.log('   ❌ No stores found in database!');
            return res.status(500).json({ 
              error: "No stores available in database",
              details: "Database is empty or corrupted. Please create a store first."
            });
          }
        }
        
        // Final verification before insert
        console.log(`   🔍 Final verification: checking store ${finalStoreId}...`);
        const finalCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [finalStoreId]);
        if (finalCheck.rows.length === 0) {
          console.error(`   ❌ CRITICAL: Store ${finalStoreId} disappeared during transaction!`);
          return res.status(500).json({
            error: "Store verification failed",
            details: `Store ${finalStoreId} not found in database`
          });
        }
        
        // Insert the company
        console.log(`   📝 Inserting company "${name}" into store ${finalStoreId}...`);
        const result = await pool.query(
          `INSERT INTO topup_companies (store_id, name, logo_url) 
           VALUES ($1, $2, $3) RETURNING *`,
          [finalStoreId, name, processedLogo || null]
        );
        
        console.log('   ✅ Company added successfully');
        res.status(201).json(result.rows[0]);
        
      } catch (error: any) {
        console.error('\n❌ ERROR in POST /api/topup/companies');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);
        
        res.status(500).json({ 
          error: error.message || "Failed to add company",
          code: error.code
        });
      }
    });

    // Update topup company - LOGO FIX: Compress and store Base64
    app.put("/api/topup/companies/:id", async (req, res) => {
      try {
        const { id } = req.params;
        let { name, logo_url } = req.body;
        
        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        // ✅ LOGO FIX: Process logo for company update
        let processedLogo = logo_url;
        
        if (logo_url && logo_url.startsWith('data:image')) {
          try {
            console.log('   🎨 Processing company logo update...');
            
            const base64Data = logo_url.replace(/^data:image\/[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            if (buffer.length > 200 * 1024) {
              const compressedBuffer = await sharp(buffer)
                .resize(150, 150, { fit: 'contain', withoutEnlargement: true })
                .png({ quality: 80 })
                .toBuffer();
              
              processedLogo = 'data:image/png;base64,' + compressedBuffer.toString('base64');
              console.log(`     ✅ Logo compressed for update`);
            }
          } catch (compressErr) {
            console.warn('     ⚠️  Logo compression warning:', (compressErr as any).message);
          }
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(name);
        }
        if (logo_url !== undefined) {
          updates.push(`logo_url = $${paramCount++}`);
          values.push(processedLogo);
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

    // Get topup categories (default to store 1)
    app.get("/api/topup/categories", async (req, res) => {
      try {
        // Use store_id from query, default to 13 (topup store)
        let storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 13;
        
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
        let { storeId } = req.params;
        
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
          `UPDATE topup_product_categories SET name = $1 WHERE id = $2 RETURNING *`,
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

    // Get all topup products (default to store 13 - topup store with actual data)
    app.get("/api/topup/products", async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        // Default store ID is 13 (topup store with actual data)
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : 13;
        
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
            tpc.name as category_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', tpi.id,
                  'url', tpi.image_url,
                  'hash', tpi.image_hash,
                  'type', tpi.image_type,
                  'uploaded_at', tpi.uploaded_at
                ) ORDER BY tpi.id ASC
              ) FILTER (WHERE tpi.id IS NOT NULL),
              '[]'::json
            ) AS gallery
          FROM topup_products tp
          LEFT JOIN topup_companies tc ON tp.company_id = tc.id
          LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
          LEFT JOIN topup_product_images tpi ON tp.id = tpi.topup_product_id
          WHERE tp.store_id = $1
          GROUP BY tp.id, tp.store_id, tp.company_id, tp.category_id, tp.amount, tp.price, tp.retail_price, tp.wholesale_price, tp.available_codes, tp.images, tp.codes, tp.is_active, tc.id, tc.name, tpc.id, tpc.name
          ORDER BY tp.created_at DESC
          LIMIT $2 OFFSET $3`,
          [storeId, limit, offset]
        );
        
        // Transform response: add images array from gallery
        const transformedRows = result.rows.map((row: any) => ({
          ...row,
          images: Array.isArray(row.gallery) ? row.gallery.map((img: any) => img.url) : []
        }));
        
        res.json(transformedRows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Get topup products
    app.get("/api/topup/products/:storeId", async (req, res) => {
      try {
        let { storeId } = req.params;
        
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        
        // No cache - always get fresh data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const result = await pool.query(
          `SELECT 
            tp.id,
            tp.store_id,
            tp.company_id,
            tp.amount,
            tp.price,
            tp.retail_price,
            tp.wholesale_price,
            tp.wholesale_price AS bulk_price,
            tp.images,
            tp.codes,
            tp.is_active,
            tc.name as company_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', tpi.id,
                  'url', tpi.image_url,
                  'hash', tpi.image_hash,
                  'type', tpi.image_type,
                  'uploaded_at', tpi.uploaded_at
                ) ORDER BY tpi.id ASC
              ) FILTER (WHERE tpi.id IS NOT NULL),
              '[]'::json
            ) AS gallery
          FROM topup_products tp
          LEFT JOIN topup_companies tc ON tp.company_id = tc.id
          LEFT JOIN topup_product_images tpi ON tp.id = tpi.topup_product_id
          WHERE tp.store_id = $1
          GROUP BY tp.id, tp.store_id, tp.company_id, tp.amount, tp.price, tp.retail_price, tp.wholesale_price, tp.images, tp.codes, tp.is_active, tc.id, tc.name
          ORDER BY tp.id DESC
          LIMIT $2 OFFSET $3`,
          [storeId, limit, offset]
        );
        
        // Transform response: add images array from gallery
        const transformedRows = result.rows.map((row: any) => ({
          ...row,
          images: Array.isArray(row.gallery) ? row.gallery.map((img: any) => img.url) : []
        }));
        
        res.json(transformedRows);
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
        const { amount, price, bulk_price, retail_price, wholesale_price, available_codes, images } = req.body;
        
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
        
        // Handle images array - send as array (PostgreSQL will handle conversion)
        if (images !== undefined && Array.isArray(images)) {
          // 🔥 CRITICAL: Filter out base64/JSON - keep ONLY valid URLs
          const validImages = images.filter((img: any) => {
            const isValidUrl = typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http'));
            const isBase64OrJson = typeof img === 'string' && (img.startsWith('data:') || img.startsWith('{'));
            if (isBase64OrJson) {
              console.warn('⚠️ [PUT] Rejecting base64/JSON data from request:', img.substring(0, 50));
            }
            return isValidUrl;
          });
          console.log('📸 [PUT] Updating product images:', validImages.length, 'valid URLs (filtered from', images.length, 'total)');
          console.log('📋 [PUT] Valid images to save:', validImages);
          updates.push(`images = $${paramCount++}`);
          values.push(validImages); // Pass array directly - PostgreSQL driver handles conversion
        }
        
        values.push(id);
        
        const query = `UPDATE topup_products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        console.log('✅ Product updated:', result.rows[0].id);
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

    // Get images for a topup product (from topup_product_images table)
    app.get("/api/topup/product-images/:storeId/:productId", async (req, res) => {
      try {
        const { storeId, productId } = req.params;
        
        const result = await pool.query(
          `SELECT id, image_data, image_type, created_at 
           FROM topup_product_images 
           WHERE store_id = $1 AND product_id = $2 
           ORDER BY created_at ASC`,
          [parseInt(storeId), parseInt(productId)]
        );
        
        res.json({
          success: true,
          count: result.rows.length,
          images: result.rows
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as any).message 
        });
      }
    });

    // Get image count for a product
    app.get("/api/topup/product-images-count/:storeId/:productId", async (req, res) => {
      try {
        const { storeId, productId } = req.params;
        
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM topup_product_images 
           WHERE store_id = $1 AND product_id = $2`,
          [parseInt(storeId), parseInt(productId)]
        );
        
        res.json({
          success: true,
          count: result.rows[0].count
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as any).message 
        });
      }
    });

    // Delete product image by URL
    app.post("/api/topup/products/:productId/remove-image", async (req, res) => {
      try {
        const { productId } = req.params;
        const { store_id, image_url } = req.body;

        if (!store_id || !image_url) {
          return res.status(400).json({ error: "Missing store_id or image_url" });
        }

        console.log(`🗑️ Deleting image: ${image_url}`);

        // Get current images array from product
        const productResult = await pool.query(
          `SELECT images FROM topup_products WHERE id = $1 AND store_id = $2`,
          [productId, store_id]
        );

        if (productResult.rows.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        const currentImages = productResult.rows[0].images || [];
        
        // Remove this image from the array
        const updatedImages = currentImages.filter((img: string) => img !== image_url);

        // Delete the file from filesystem if it's from our uploads
        if (image_url.includes('/uploads/')) {
          try {
            const filePath = path.join(__dirname, image_url);
            if (fs.existsSync(filePath)) {
              await unlink(filePath);
              console.log(`✅ File deleted from filesystem: ${filePath}`);
            }
          } catch (fileErr) {
            console.warn(`⚠️ Could not delete file: ${image_url}`, fileErr);
            // Continue even if file delete fails
          }
        }

        // Delete from topup_product_images table
        try {
          await pool.query(
            `DELETE FROM topup_product_images WHERE topup_product_id = $1 AND image_url = $2`,
            [productId, image_url]
          );
          console.log(`✅ Deleted from topup_product_images: ${image_url}`);
        } catch (dbErr) {
          console.warn(`⚠️ Could not delete from database: ${image_url}`, dbErr);
        }

        // Update product with new images array
        await pool.query(
          `UPDATE topup_products SET images = $1 WHERE id = $2 AND store_id = $3`,
          [updatedImages, productId, store_id]
        );

        console.log(`✅ Product images updated. Remaining: ${updatedImages.length}`);

        res.json({
          success: true,
          message: "Image deleted successfully",
          remaining_images: updatedImages
        });
      } catch (error) {
        console.error('❌ Error deleting image:', error);
        res.status(500).json({ 
          success: false, 
          error: (error as any).message 
        });
      }
    });

    // Delete an image (after customer downloads it)
    app.delete("/api/topup/product-images/:imageId", async (req, res) => {
      try {
        const { imageId } = req.params;
        
        // Get image info before deletion
        const imageInfo = await pool.query(
          `SELECT store_id, product_id FROM topup_product_images WHERE id = $1`,
          [parseInt(imageId)]
        );
        
        if (imageInfo.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: "Image not found" 
          });
        }
        
        // Delete the image
        await pool.query(
          `DELETE FROM topup_product_images WHERE id = $1`,
          [parseInt(imageId)]
        );
        
        console.log(`🗑️  Image deleted: ${imageId} (store: ${imageInfo.rows[0].store_id}, product: ${imageInfo.rows[0].product_id})`);
        
        res.json({
          success: true,
          message: "Image deleted successfully",
          deletedImageId: imageId
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as any).message 
        });
      }
    });

    // Add images to topup product (admin endpoint)
    app.post("/api/topup/add-product-images", async (req, res) => {
      try {
        const { store_id, product_id, images } = req.body;
        
        if (!store_id || !product_id || !Array.isArray(images) || images.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields: store_id, product_id, images array"
          });
        }
        
        let insertedCount = 0;
        let duplicateCount = 0;
        
        for (const imageData of images) {
          try {
            const result = await pool.query(
              `INSERT INTO topup_product_images (store_id, product_id, image_data, image_type)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING
               RETURNING id`,
              [store_id, product_id, imageData, 'svg']
            );
            
            if (result.rows.length > 0) {
              insertedCount++;
            } else {
              duplicateCount++;
            }
          } catch (err) {
            console.error(`⚠️  Error inserting image: ${err}`);
          }
        }
        
        console.log(`✅ Images added: ${insertedCount} inserted, ${duplicateCount} duplicates`);
        
        res.json({
          success: true,
          message: `Added ${insertedCount} images`,
          inserted: insertedCount,
          duplicates: duplicateCount
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as any).message 
        });
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

    // Upload images to Firebase Storage (supports multipart/form-data for large files)
    app.post("/api/topup/upload-images-firebase", upload.array('images', 100), async (req, res) => {
      try {
        console.log('📤 Starting Firebase image upload request...');
        const { store_id, topup_product_id } = req.body;
        const files = (req as any).files as any[];

        // No cache for modifications
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (!store_id || !topup_product_id) {
          console.warn('⚠️ Missing required fields for Firebase upload');
          return res.status(400).json({ error: "Missing store_id or topup_product_id" });
        }

        if (!files || files.length === 0) {
          console.warn('⚠️ No files provided');
          return res.status(400).json({ error: "No files provided" });
        }

        console.log('📁 Files received:', files.length, 'files');
        files.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f.originalname}: ${(f.size / 1024).toFixed(2)} KB (${f.mimetype})`);
        });

        // Get existing images from database
        const existingResult = await pool.query(
          `SELECT images FROM topup_products WHERE id = $1 AND store_id = $2`,
          [topup_product_id, store_id]
        );

        if (existingResult.rows.length === 0) {
          console.warn('⚠️ Product not found');
          return res.status(404).json({ error: "Product not found" });
        }

        const existingImageUrls: string[] = existingResult.rows[0].images ? 
          (Array.isArray(existingResult.rows[0].images) ? existingResult.rows[0].images : 
           (typeof existingResult.rows[0].images === 'string' ? JSON.parse(existingResult.rows[0].images) : [])) 
          : [];
        
        const uploadedUrls: string[] = [];
        const duplicateUrls: string[] = [];

        // 🎯 Save to local storage (uploads directory)
        console.log('💾 Saving images to local storage...');
        
        // Create uploads directory if needed
        const uploadsDir = path.join(__dirname, 'uploads', 'topup', String(store_id), String(topup_product_id));
        await mkdir(uploadsDir, { recursive: true });
        
        for (const file of files) {
          try {
            const buffer = file.buffer;

            // Generate unique filename based on original name
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const ext = path.extname(file.originalname) || '.jpg';
            const baseName = path.basename(file.originalname, ext);
            const fileName = `${baseName}-${timestamp}-${randomStr}${ext}`;
            const filePath = path.join(uploadsDir, fileName);

            // Create MD5 hash of image for duplicate detection
            const imageHash = crypto.createHash('md5').update(buffer).digest('hex');

            // Check if this hash already exists in database
            const hashCheckResult = await pool.query(
              `SELECT id FROM topup_product_images 
               WHERE topup_product_id = $1 AND image_hash = $2 LIMIT 1`,
              [topup_product_id, imageHash]
            );

            if (hashCheckResult.rows.length > 0) {
              // Image already exists - don't upload
              duplicateUrls.push(file.originalname);
              console.log('⏭️ Image already exists (duplicate hash):', imageHash);
              continue;
            }

            // Save to local filesystem
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });
            console.log('✅ File saved locally:', filePath);

            // Store reference in database with local path
            const imageUrl = `/uploads/topup/${store_id}/${topup_product_id}/${fileName}`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              `INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5)`,
              [topup_product_id, imageBase64, imageUrl, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrl);
            console.log(`✅ Image processed: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB) → ${imageUrl}`);
          } catch (uploadErr) {
            console.error('❌ Error saving image locally:', uploadErr);
          }
        }

        // 🔥 Update topup_products table with image URLs - APPEND to existing images
        if (uploadedUrls.length > 0) {
          try {
            // Combine existing images + newly uploaded images
            const finalImages = [...existingImageUrls, ...uploadedUrls];
            console.log('🔗 Combining images: existing=', existingImageUrls.length, '+ new=', uploadedUrls.length, '= total', finalImages.length);
            
            const updateResult = await pool.query(
              `UPDATE topup_products SET images = $1 WHERE id = $2 AND store_id = $3 RETURNING images`,
              [finalImages, topup_product_id, store_id]
            );
            console.log('✅ Product images updated in database:', finalImages.length, 'total images');
            console.log('✅ Final images array:', finalImages);
          } catch (updateErr) {
            console.error('⚠️ Warning: Could not update product images in database:', updateErr);
          }
        } else {
          console.warn('⚠️ No new images uploaded');
        }

        let message = `تم تحميل ${uploadedUrls.length} صورة جديدة بنجاح`;
        if (duplicateUrls.length > 0) {
          message += ` (تم تخطي ${duplicateUrls.length} صور مكررة)`;
        }

        console.log('✅ Images uploaded successfully:', { 
          product_id: topup_product_id, 
          new_count: uploadedUrls.length, 
          duplicate_count: duplicateUrls.length,
          total_size_mb: (files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)
        });

        // Return ALL images (existing + new), not just the new ones
        const allImages = [...existingImageUrls, ...uploadedUrls];
        res.json({ 
          success: true, 
          message, 
          image_urls: uploadedUrls,
          all_images: allImages
        });
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
        const { store_id, topup_product_id, quantity, customer_id, customer_type, phone, total_amount, selected_images } = req.body;

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
                `INSERT INTO customers (store_id, phone, name, current_debt, starting_balance, is_active)
                 VALUES ($1, $2, $3, 0, 0, true)
                 RETURNING id`,
                [parsedStoreId, phone, `عميل جديد - ${phone}`]
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

        // Update customer's current_debt to reflect the new topup purchase
        await pool.query(
          `UPDATE customers SET current_debt = current_debt + $1 WHERE id = $2`,
          [total_amount, foundCustomerId]
        );
        console.log(`💳 [TOPUP PURCHASE] Customer ${foundCustomerId} debt increased by ${total_amount}`);

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
            // Use selected images if provided, otherwise use first 'quantity' images
            let usedImages = [];
            let remainingImages = imagesArray;
            
            if (Array.isArray(selected_images) && selected_images.length > 0) {
              // Use only the selected images
              usedImages = selected_images.filter((img: string) => imagesArray.includes(img));
              // Remove selected images from remaining
              remainingImages = imagesArray.filter((img: string) => !usedImages.includes(img));
              console.log(`🖼️  Using ${usedImages.length} selected images. Remaining: ${remainingImages.length}`);
            } else {
              // Fallback: use first 'quantity' images
              usedImages = imagesArray.slice(0, quantity);
              remainingImages = imagesArray.slice(quantity);
              console.log(`🖼️  Using first ${usedImages.length} images. Remaining: ${remainingImages.length}`);
            }
            
            // Store used images in order_images table AND delete from topup_product_images
            for (const image of usedImages) {
              try {
                // Store in order_images
                await pool.query(
                  `INSERT INTO order_images (order_id, topup_product_id, image_url)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (order_id, topup_product_id, image_url) DO NOTHING`,
                  [orderId, topup_product_id, image]
                );
                
                // 🗑️ DELETE from topup_product_images (so it doesn't appear in API response)
                await pool.query(
                  `DELETE FROM topup_product_images WHERE topup_product_id = $1 AND image_url = $2`,
                  [topup_product_id, image]
                );
                
                console.log(`🗑️  Deleted image from topup_product_images: ${image}`);
              } catch (err) {
                console.error(`⚠️  Error processing image: ${err}`);
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

        // Get the images that were stored for this order
        const storedImagesResult = await pool.query(
          `SELECT image_url FROM order_images WHERE order_id = $1 ORDER BY created_at ASC`,
          [orderId]
        );
        
        const storedImages = storedImagesResult.rows.map(row => row.image_url);

        console.log(`\n✅ ========== TOPUP PURCHASE COMPLETED SUCCESSFULLY ==========\n`);
        res.json({ 
          success: true, 
          order_id: orderId, 
          message: "✓ تم إتمام الشراء بنجاح",
          images: storedImages
        });
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
           ORDER BY oi.topup_product_id, oi.created_at ASC`,
          [orderId]
        );

        if (imagesResult.rows.length === 0) {
          return res.status(404).json({ error: "No images found for this order", images: [], grouped_by_product: {} });
        }

        // Group images by product_id
        const groupedByProduct: {[key: number]: any[]} = {};
        const allImages: any[] = [];
        
        imagesResult.rows.forEach(row => {
          const productId = row.topup_product_id;
          
          if (!groupedByProduct[productId]) {
            groupedByProduct[productId] = [];
          }
          
          const imageObj = {
            image_url: row.image_url,
            image_data: row.image_data,
            product_id: productId,
            amount: row.amount,
            price: row.price
          };
          
          groupedByProduct[productId].push(imageObj);
          allImages.push(imageObj);
        });

        res.json({
          order_id: orderId,
          images: allImages,
          grouped_by_product: groupedByProduct,
          count: allImages.length
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

        // جلب الصور المحفوظة مع الطلب من جدول order_images
        const imagesResult = await pool.query(
          `SELECT image_url FROM order_images WHERE order_id = $1 ORDER BY created_at ASC`,
          [orderId]
        );

        const imageUrls = imagesResult.rows.map(row => row.image_url);

        res.json({
          order_id: orderId,
          store_id: order.store_id,
          status: order.status,
          codes: imageUrls,  // Send images as codes
          images: imageUrls,  // Also send as images
          count: imageUrls.length
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // 🎁 Download order package with codes and images - DELETE AFTER DOWNLOAD
    app.get("/api/topup/download-package/:orderId", async (req, res) => {
      try {
        const { orderId } = req.params;
        console.log(`📦 Starting download package for order: ${orderId}`);

        // جلب بيانات الطلب
        const orderResult = await pool.query(
          `SELECT id, store_id, status FROM orders WHERE id = $1`,
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orderResult.rows[0];

        // جلب المنتجات والأكواد
        const itemsResult = await pool.query(
          `SELECT topup_product_id, quantity FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        let allCodes: string[] = [];
        let imageUrls: string[] = [];

        for (const item of itemsResult.rows) {
          // Get product codes
          const productResult = await pool.query(
            `SELECT codes, images FROM topup_products WHERE id = $1`,
            [item.topup_product_id]
          );

          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            if (product.codes && Array.isArray(product.codes)) {
              const codesToAdd = product.codes.slice(0, item.quantity);
              allCodes = [...allCodes, ...codesToAdd];
            }
            // جمع روابط الصور
            if (product.images && Array.isArray(product.images)) {
              imageUrls = [...imageUrls, ...product.images];
            }
          }
        }

        // إنشاء ZIP file
        const fileName = `order-${orderId}-${Date.now()}`;
        const zipPath = path.join(__dirname, 'uploads', `${fileName}.zip`);
        
        // تأكد من وجود مجلد uploads
        await mkdir(path.join(__dirname, 'uploads'), { recursive: true });

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // إضافة ملف الأكواد
        if (allCodes.length > 0) {
          const codesText = `🎁 أكواد الطلب #${orderId}\n━━━━━━━━━━━━━━━━━\n${allCodes.join('\n')}\n\n📋 عدد الأكواد: ${allCodes.length}`;
          archive.append(codesText, { name: `codes-${orderId}.txt` });
        }

        // إضافة الصور
        let imagesAdded = 0;
        for (const imageUrl of imageUrls) {
          try {
            // إذا كانت صورة من التخزين المحلي (uploads/)
            if (imageUrl.includes('/uploads/') || fs.existsSync(imageUrl)) {
              const fileName = path.basename(imageUrl);
              archive.file(imageUrl, { name: `images/${fileName}` });
              imagesAdded++;
            }
          } catch (err) {
            console.warn(`⚠️ Could not add image: ${imageUrl}`);
          }
        }

        archive.on('error', (err) => {
          console.error('❌ Archive error:', err);
          res.status(500).json({ error: 'Failed to create download package' });
        });

        output.on('close', async () => {
          console.log(`✅ ZIP created: ${archive.pointer()} bytes`);
          
          // إرسال الملف
          res.download(zipPath, `order-${orderId}.zip`, async (err) => {
            if (err) {
              console.error('❌ Download error:', err);
            } else {
              console.log(`✅ Download started for order ${orderId}`);
            }
            
            // حذف الملف والصور بعد 5 ثوان من البدء (التنزيل عادة ينتهي في ثانية)
            setTimeout(async () => {
              try {
                // حذف ZIP
                await unlink(zipPath);
                console.log(`🧹 ZIP deleted: ${zipPath}`);
                
                // حذف صور المنتجات من الخادم (بعد التنزيل)
                for (const imageUrl of imageUrls) {
                  if (imageUrl.includes('/uploads/') && fs.existsSync(imageUrl)) {
                    try {
                      await unlink(imageUrl);
                      console.log(`🧹 Image deleted: ${imageUrl}`);
                    } catch (unlinkErr) {
                      console.warn(`⚠️ Could not delete image: ${imageUrl}`);
                    }
                  }
                }
                
                // تحديث قاعدة البيانات - تنظيف صور المنتج إذا كانت كل صوره تم حذفها
                for (const item of itemsResult.rows) {
                  await pool.query(
                    `UPDATE topup_products SET images = '[]' WHERE id = $1`,
                    [item.topup_product_id]
                  );
                }
                
                console.log(`✅ Cleanup completed for order ${orderId}`);
              } catch (cleanupErr) {
                console.error('❌ Cleanup error:', cleanupErr);
              }
            }, 5000);
          });
        });

        archive.pipe(output);
        archive.finalize();

      } catch (error) {
        console.error('❌ ERROR in download-package:', error);
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
              `UPDATE customers SET current_debt = GREATEST(0, current_debt - $1) WHERE id = $2 RETURNING current_debt`,
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

    const ensureAuctionSaleColumns = async () => {
      await pool.query(`
        ALTER TABLE auctions
        ADD COLUMN IF NOT EXISTS final_sale_price NUMERIC,
        ADD COLUMN IF NOT EXISTS sold_bidder_bid_id INTEGER,
        ADD COLUMN IF NOT EXISTS sold_bidder_name TEXT,
        ADD COLUMN IF NOT EXISTS sold_bidder_phone TEXT,
        ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP NULL
      `);
    };

    // GET all active/pending auctions for regular stores with the real auction row id
    app.get("/api/auctions/active", async (req, res) => {
      try {
        await ensureAuctionSaleColumns();
        const includeSold = String(req.query.includeSold || '').toLowerCase() === 'true';

        const result = await pool.query(`
          SELECT 
            a.id as id,
            a.id as auction_id,
            COALESCE(p.id, a.product_id) as product_id,
            p.name as product_name,
            p.image_url,
            COALESCE(p.store_id, a.store_id) as store_id,
            s.store_name,
            COALESCE(a.starting_price, p.auction_price) as starting_price,
            COALESCE(
              (SELECT MAX(ab.bid_price) FROM auction_bids ab WHERE ab.auction_id = a.id),
              a.current_highest_price,
              p.auction_price
            ) as current_highest_price,
            COALESCE(
              (SELECT MAX(ab.bid_price) FROM auction_bids ab WHERE ab.auction_id = a.id),
              a.current_highest_price,
              p.auction_price
            ) as highest_bid,
            TO_CHAR(COALESCE(a.auction_date, p.auction_date), 'YYYY-MM-DD') as auction_date,
            TO_CHAR(COALESCE(a.auction_start_time, p.auction_start_time), 'HH24:MI') as auction_start_time,
            TO_CHAR(COALESCE(a.auction_end_time, p.auction_end_time), 'HH24:MI') as auction_end_time,
            COALESCE(p.is_auction, true) as is_auction,
            a.final_sale_price,
            a.sold_bidder_bid_id,
            a.sold_bidder_name,
            a.sold_bidder_phone,
            a.sold_at,
            CASE
              WHEN a.sold_at IS NOT NULL THEN 'sold'
              WHEN COALESCE(a.auction_date, p.auction_date) < CURRENT_DATE
                OR (COALESCE(a.auction_date, p.auction_date) = CURRENT_DATE AND COALESCE(a.auction_end_time, p.auction_end_time) < CURRENT_TIME)
                THEN 'ended'
              WHEN COALESCE(a.auction_date, p.auction_date) > CURRENT_DATE
                OR (COALESCE(a.auction_date, p.auction_date) = CURRENT_DATE AND COALESCE(a.auction_start_time, p.auction_start_time) > CURRENT_TIME)
                THEN 'pending'
              ELSE COALESCE(a.status, 'active')
            END as status,
            COALESCE((SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.id), 0) as total_bids
          FROM auctions a
          LEFT JOIN products p ON p.id = a.product_id
          LEFT JOIN stores s ON COALESCE(p.store_id, a.store_id) = s.id
          WHERE COALESCE(a.auction_date, p.auction_date) IS NOT NULL
          AND COALESCE(a.auction_start_time, p.auction_start_time) IS NOT NULL
          AND COALESCE(a.auction_end_time, p.auction_end_time) IS NOT NULL
          AND COALESCE(a.starting_price, p.auction_price) IS NOT NULL
          AND COALESCE(s.store_type, 'regular') != 'topup'
          AND ($1::boolean = true OR a.sold_at IS NULL)
          ORDER BY COALESCE(a.auction_date, p.auction_date) ASC, COALESCE(a.auction_end_time, p.auction_end_time) ASC
        `, [includeSold]);

        res.json(result.rows || []);
      } catch (error) {
        console.error('❌ Auctions API error:', error);
        res.json([]); // Return empty array instead of 500 error
      }
    });

    // GET auction details
    app.get("/api/auctions/:id", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);
        
        const auctionResult = await pool.query(`
          SELECT 
            a.*,
            a.auction_date::text as auction_date_formatted,
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

        const auctionData = auctionResult.rows[0];
        
        res.json({
          auction: {
            ...auctionData,
            auction_date: auctionData.auction_date_formatted
          },
          bids: bidsResult.rows
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // GET auction data by product ID (for edit form) - reads from products table columns
    app.get("/api/auctions", async (req, res) => {
      try {
        const productId = req.query.productId ? parseInt(req.query.productId as string) : null;
        
        if (!productId) {
          return res.status(400).json({ error: 'productId is required' });
        }
        
        // Read directly from products table columns (NEW: consolidated data)
        const productResult = await pool.query(`
          SELECT 
            p.id,
            p.id as product_id,
            p.store_id,
            p.is_auction,
            p.auction_price as starting_price,
            p.auction_price as current_highest_price,
            to_char(p.auction_date, 'YYYY-MM-DD') as auction_date,
            to_char(p.auction_start_time, 'HH24:MI') as auction_start_time,
            to_char(p.auction_end_time, 'HH24:MI') as auction_end_time
          FROM products p
          WHERE p.id = $1
          AND p.is_auction = true
        `, [productId]);

        if (productResult.rows.length === 0) {
          console.log('⚠️ No auction found for product:', productId);
          return res.status(404).json(null);
        }

        const auctionData = productResult.rows[0];
        
        console.log('✅ Sending auction data from products table:');
        console.log('  product_id:', auctionData.product_id);
        console.log('  auction_date:', auctionData.auction_date);
        console.log('  auction_start_time:', auctionData.auction_start_time);
        console.log('  auction_end_time:', auctionData.auction_end_time);
        console.log('  starting_price:', auctionData.starting_price);
        
        res.json(auctionData);
      } catch (error) {
        console.error('Error fetching auction by product ID:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // POST create new auction
    app.post("/api/auctions", async (req, res) => {
      try {
        const { product_id, auction_date, auction_start_time, auction_end_time, starting_price } = req.body;

        console.log('📝 AUCTION REQUEST RECEIVED:', {
          product_id,
          auction_date,
          auction_start_time,
          auction_end_time,
          starting_price,
          types: {
            product_id: typeof product_id,
            auction_date: typeof auction_date,
            auction_start_time: typeof auction_start_time,
            auction_end_time: typeof auction_end_time,
            starting_price: typeof starting_price
          }
        });

        // Validate inputs
        if (!product_id || !auction_date || !auction_start_time || !auction_end_time || !starting_price) {
          console.error('❌ MISSING FIELDS:', {
            product_id: !product_id ? 'MISSING' : 'OK',
            auction_date: !auction_date ? 'MISSING' : 'OK',
            auction_start_time: !auction_start_time ? 'MISSING' : 'OK',
            auction_end_time: !auction_end_time ? 'MISSING' : 'OK',
            starting_price: !starting_price ? 'MISSING' : 'OK'
          });
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

        const result = await pool.query(`
          INSERT INTO auctions (product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price, current_highest_price, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
          RETURNING *
        `, [product_id, store_id, auction_date, auction_start_time, auction_end_time, starting_price, 0]);

        console.log('✅ AUCTION CREATED:', result.rows[0]);

        // Update product to mark as auction
        await pool.query(`
          UPDATE products
          SET is_auction = true, auction_id = $1
          WHERE id = $2
        `, [result.rows[0].id, product_id]);

        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('❌ ERROR CREATING AUCTION:', error);
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

        // Place bid (bidder_id is null for anonymous bids, customer_id can also be null)
        const bidResult = await pool.query(`
          INSERT INTO auction_bids (auction_id, bidder_id, customer_id, bid_amount, customer_name, customer_phone, bid_price)
          VALUES ($1, $2, $2, $3, $4, $5, $3)
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

    // Finalize auction sale and add to total sales
    app.post("/api/auctions/:id/finalize", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);
        const {
          final_sale_price,
          sold_bidder_bid_id,
          sold_bidder_name,
          sold_bidder_phone
        } = req.body;

        await pool.query(`
          ALTER TABLE stores
          ADD COLUMN IF NOT EXISTS total_regular_sales NUMERIC DEFAULT 0
        `);
        await ensureAuctionSaleColumns();

        if (!final_sale_price) {
          return res.status(400).json({ error: 'Final sale price is required' });
        }

        // Get auction details
        const auctionResult = await pool.query(`
          SELECT a.*, p.store_id, p.name as product_name 
          FROM auctions a
          LEFT JOIN products p ON a.product_id = p.id
          WHERE a.id = $1
        `, [auctionId]);

        if (auctionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auction not found' });
        }

        const auction = auctionResult.rows[0];
        const storeId = auction.store_id;

        const previousSale = parseFloat(auction.final_sale_price || 0);
        const newSaleAmount = parseFloat(final_sale_price);

        // Persist selected buyer and sale amount so it can be reversed later
        await pool.query(`
          UPDATE auctions
          SET final_sale_price = $1,
              sold_bidder_bid_id = $2,
              sold_bidder_name = $3,
              sold_bidder_phone = $4,
              sold_at = NOW(),
              status = 'completed',
              current_highest_price = $1
          WHERE id = $5
        `, [
          newSaleAmount,
          sold_bidder_bid_id || null,
          sold_bidder_name || null,
          sold_bidder_phone || null,
          auctionId
        ]);

        const updatedTotalSales = await syncStoreAuctionSalesTotal(storeId);

        await pool.query(`
          UPDATE products
          SET is_auction = true
          WHERE id = $1
        `, [auction.product_id]);

        res.json({ 
          success: true, 
          message: 'تم حفظ المبيعة وإضافتها لإجمالي المبيعات',
          sale_amount: newSaleAmount,
          previous_sale_amount: previousSale,
          new_total_sales: updatedTotalSales
        });
      } catch (error) {
        console.error('❌ Error finalizing auction:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    app.delete("/api/auctions/:id/finalize", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);

        await pool.query(`
          ALTER TABLE stores
          ADD COLUMN IF NOT EXISTS total_regular_sales NUMERIC DEFAULT 0
        `);
        await ensureAuctionSaleColumns();

        const auctionResult = await pool.query(`
          SELECT a.final_sale_price, a.product_id, p.store_id
          FROM auctions a
          LEFT JOIN products p ON a.product_id = p.id
          WHERE a.id = $1
        `, [auctionId]);

        if (auctionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auction not found' });
        }

        const auction = auctionResult.rows[0];
        const finalSalePrice = parseFloat(auction.final_sale_price || 0);

        if (!finalSalePrice) {
          return res.status(400).json({ error: 'لا توجد مبيعة مؤكدة لهذا المزاد' });
        }

        await pool.query(`
          UPDATE auctions
          SET final_sale_price = NULL,
              sold_bidder_bid_id = NULL,
              sold_bidder_name = NULL,
              sold_bidder_phone = NULL,
              sold_at = NULL,
              status = 'active'
          WHERE id = $1
        `, [auctionId]);

        const updatedTotalSales = await syncStoreAuctionSalesTotal(auction.store_id);

        res.json({
          success: true,
          message: 'تم حذف المشتري المؤكد وتحديث إجمالي المبيعات',
          removed_sale_amount: finalSalePrice,
          new_total_sales: updatedTotalSales
        });
      } catch (error) {
        console.error('❌ Error removing auction sale:', error);
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
        const storeId = parseInt(auction.store_id);

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

        if (!Number.isNaN(storeId)) {
          await syncStoreAuctionSalesTotal(storeId);
        }

        res.json({ message: 'Auction deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // GET all bidders for a specific auction (for merchant)
    app.get("/api/auctions/:id/bidders", async (req, res) => {
      try {
        const auctionId = parseInt(req.params.id);

        await ensureAuctionSaleColumns();

        const result = await pool.query(`
          SELECT 
            ab.id,
            ab.bidder_id,
            ab.customer_id,
            ab.customer_name,
            ab.customer_phone,
            ab.bid_price,
            ab.bid_time,
            CASE WHEN a.sold_bidder_bid_id = ab.id THEN true ELSE false END as is_confirmed_sale,
            ROW_NUMBER() OVER (ORDER BY ab.bid_price DESC) as position
          FROM auction_bids ab
          LEFT JOIN auctions a ON a.id = ab.auction_id
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
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        await pool.query(
          `UPDATE customers SET 
            current_debt = current_debt - $1
           WHERE id = $2`,
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
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        if (amountDifference !== 0) {
          await pool.query(
            `UPDATE customers SET 
              current_debt = current_debt + $1
             WHERE id = $2`,
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
        // ⭐ starting_balance (الديون السابقة) must remain IMMUTABLE
        await pool.query(
          `UPDATE customers SET 
            current_debt = current_debt + $1
           WHERE id = $2`,
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

    // Initialize store 1 with test products
    app.get("/api/init/store1-products", async (req, res) => {
      try {
        console.log('🔧 Initializing store 1 with test products...');
        
        // Create SVG images
        const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+';
        const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+';
        const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MTV4NTwvdGV4dD48L3N2Zz4=';
        
        // Delete old products
        await pool.query('DELETE FROM topup_products WHERE store_id = 1');
        
        // Get or create companies
        const companies = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = 1');
        
        let companyIds: { [key: string]: number } = {};
        if (companies.rows.length === 0) {
          const newCompanies = await pool.query(`
            INSERT INTO topup_companies (store_id, name, logo_url)
            VALUES 
              (1, 'زين أثير', 'https://via.placeholder.com/100'),
              (1, 'آسيا سيل', 'https://via.placeholder.com/100'),
              (1, 'كورك', 'https://via.placeholder.com/100')
            RETURNING id, name
          `);
          newCompanies.rows.forEach(c => {
            companyIds[c.name] = c.id;
          });
        } else {
          companies.rows.forEach(c => {
            companyIds[c.name] = c.id;
          });
        }
        
        // Add products
        const products = await pool.query(`
          INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, images, is_active)
          VALUES 
            (1, $1, 1, 35000, 40000, 38000, 37000, $2, true),
            (1, $3, 1, 25000, 27500, 26500, 26000, $4, true),
            (1, $5, 1, 15000, 17500, 16500, 16000, $6, true)
          RETURNING id, amount, price, array_length(images, 1) as images_count
        `, [
          companyIds['زين أثير'],
          [svg1, svg2, svg3, svg1, svg2],
          companyIds['آسيا سيل'],
          [svg3, svg1, svg2, svg3, svg1, svg2, svg3],
          companyIds['كورك'],
          [svg2, svg3, svg1, svg2, svg3]
        ]);
        
        console.log('✅ Initialized store 1 with products:');
        products.rows.forEach(p => {
          console.log(`   - ID: ${p.id} | Amount: ${p.amount} | Price: ${p.price} | Images: ${p.images_count}`);
        });
        
        res.json({ 
          success: true, 
          message: '✅ تم تهيئة المنتجات بنجاح',
          products: products.rows
        });
      } catch (error) {
        console.error('❌ Error initializing:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });

    // ==================== IMAGE UPLOAD ENDPOINTS ====================
    
    // Setup uploads directory
    const uploadsDir = path.join(__dirname, 'public', 'uploads', 'products');
    const uploadsPath = path.join(uploadsDir);
    
    try {
      await mkdir(uploadsPath, { recursive: true });
      console.log('✅ Upload directory ready:', uploadsPath);
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        console.warn('⚠️ Warning: Could not create uploads directory:', e.message);
      }
    }
    
    // POST /api/products/:productId/images - Upload image for product
    app.post("/api/products/:productId/images", async (req, res) => {
      try {
        const { productId } = req.params;
        const { store_id, image_url, image_type = 'jpeg', file_size = 0 } = req.body;
        
        if (!productId || !store_id || !image_url) {
          return res.status(400).json({ error: 'Missing required fields: productId, store_id, image_url' });
        }
        
        // Extract base64 if provided
        let finalImageUrl = image_url;
        let savedFileName = '';
        
        // If image_url contains data:image, save to disk
        if (image_url.startsWith('data:')) {
          try {
            const base64Data = image_url.replace(/^data:image\/[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            savedFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${image_type === 'png' ? 'png' : 'jpg'}`;
            const filePath = path.join(uploadsPath, savedFileName);
            
            fs.writeFileSync(filePath, buffer);
            finalImageUrl = `/uploads/products/${savedFileName}`;
            console.log(`✅ Image saved to disk: ${finalImageUrl}`);
          } catch (e) {
            console.warn('⚠️ Could not save image to disk, using base64 in DB:', e);
          }
        }
        
        // Insert into database
        const result = await pool.query(
          `INSERT INTO product_images (product_id, store_id, image_url, image_type, file_size)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, image_url, uploaded_at`,
          [productId, store_id, finalImageUrl, image_type, file_size || 0]
        );
        
        res.status(201).json({
          success: true,
          image_id: result.rows[0].id,
          image_url: result.rows[0].image_url,
          uploaded_at: result.rows[0].uploaded_at
        });
        
        res.status(201).json({
          success: true,
          image_id: result.rows[0].id,
          image_url: result.rows[0].image_url,
          created_at: result.rows[0].created_at
        });
      } catch (error: any) {
        console.error('Image upload error:', error.message);
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/products/:productId/images - Get all images for product
    app.get("/api/products/:productId/images", async (req, res) => {
      try {
        const { productId } = req.params;
        const { store_id } = req.query;
        
        if (!productId) {
          return res.status(400).json({ error: 'productId required' });
        }
        
        let query = `SELECT * FROM product_images WHERE product_id = $1`;
        let params: any[] = [productId];
        
        if (store_id) {
          query += ` AND store_id = $2`;
          params.push(store_id);
        }
        
        query += ` ORDER BY id DESC`;
        
        const result = await pool.query(query, params);
        
        res.json({
          count: result.rows.length,
          images: result.rows
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // DELETE /api/products/:productId/images/:imageId - Delete image
    app.delete("/api/products/:productId/images/:imageId", async (req, res) => {
      try {
        const { productId, imageId } = req.params;
        
        // Get image first to delete file if exists
        const getResult = await pool.query(
          `SELECT image_url FROM product_images WHERE id = $1 AND product_id = $2`,
          [imageId, productId]
        );
        
        if (getResult.rows.length === 0) {
          return res.status(404).json({ error: 'Image not found' });
        }
        
        const imageUrl = getResult.rows[0].image_url;
        
        // Delete from database
        await pool.query(
          `DELETE FROM product_images WHERE id = $1`,
          [imageId]
        );
        
        // Try to delete file if it's a local file
        if (imageUrl.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', imageUrl);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`✅ Deleted file: ${filePath}`);
            }
          } catch (e: any) {
            console.warn('⚠️ Could not delete file:', e.message);
          }
        }
        
        res.json({ success: true, message: 'Image deleted' });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // === CLEANUP ENDPOINTS ===
    
    // Admin: Cleanup orphaned auctions (auctions for deleted products)
    app.post("/api/admin/cleanup/orphaned-auctions", async (req, res) => {
      try {
        console.log("🧹 [ADMIN] Cleaning up orphaned auction records...");
        
        // Step 1: Count orphaned auctions before cleanup
        const orphanedCountRes = await pool.query(`
          SELECT COUNT(*) as count FROM auctions a
          LEFT JOIN products p ON a.product_id = p.id
          WHERE p.id IS NULL
        `);
        const orphanedCount = parseInt(orphanedCountRes.rows[0].count);
        console.log(`📊 Found ${orphanedCount} orphaned auction records`);
        
        // Step 2: Get list of orphaned product IDs for verification
        const orphanedIdsRes = await pool.query(`
          SELECT DISTINCT a.product_id FROM auctions a
          LEFT JOIN products p ON a.product_id = p.id
          WHERE p.id IS NULL
          ORDER BY a.product_id
        `);
        const orphanedIds = orphanedIdsRes.rows.map(r => r.product_id);
        console.log(`🔍 Orphaned product IDs: ${orphanedIds.join(', ') || 'NONE'}`);
        
        // Step 3: Delete orphaned auctions using explicit product IDs
        let deletedCount = 0;
        if (orphanedCount > 0 && orphanedIds.length > 0) {
          const placeholders = orphanedIds.map((_, i) => `$${i + 1}`).join(',');
          const deleteQuery = `DELETE FROM auctions WHERE product_id IN (${placeholders})`;
          console.log(`🗑️ Executing delete query with ${orphanedIds.length} product IDs...`);
          
          const deleteRes = await pool.query(deleteQuery, orphanedIds);
          deletedCount = deleteRes.rowCount;
          console.log(`✅ Deleted ${deletedCount} orphaned auction records`);
        }
        
        // Step 4: Check if CASCADE DELETE constraint exists
        const constraintRes = await pool.query(`
          SELECT constraint_name FROM information_schema.table_constraints
          WHERE table_name='auctions' 
          AND constraint_type='FOREIGN KEY'
          AND constraint_name='auctions_product_id_fkey'
        `);
        
        let constraintStatus = 'exists';
        const hasConstraint = constraintRes.rows.length > 0;
        
        if (!hasConstraint) {
          try {
            console.log("🔐 Adding CASCADE DELETE foreign key constraint...");
            // Drop existing foreign key if any
            await pool.query(`
              ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_product_id_fkey
            `);
            
            // Create new constraint with CASCADE DELETE
            await pool.query(`
              ALTER TABLE auctions
              ADD CONSTRAINT auctions_product_id_fkey
              FOREIGN KEY (product_id) REFERENCES products(id) 
              ON DELETE CASCADE
            `);
            constraintStatus = 'added';
            console.log("✅ CASCADE DELETE constraint added");
          } catch (err: any) {
            console.warn("⚠️ Could not add constraint:", err.message);
            constraintStatus = 'error';
          }
        }
        
        // Step 5: Verify final count
        const finalCountRes = await pool.query('SELECT COUNT(*) as count FROM auctions');
        const finalCount = parseInt(finalCountRes.rows[0].count);
        
        console.log(`📊 Final auction count: ${finalCount}`);
        
        res.json({
          success: true,
          message: "✅ Orphaned auction cleanup completed",
          cleanup: {
            orphanedFound: orphanedCount,
            orphanedProductIds: orphanedIds,
            deleted: deletedCount,
            finalAuctionCount: finalCount
          },
          constraint: {
            status: constraintStatus,
            exists: hasConstraint,
            message: constraintStatus === 'added' 
              ? 'CASCADE DELETE constraint added' 
              : constraintStatus === 'exists'
              ? 'CASCADE DELETE constraint already exists'
              : 'Could not add CASCADE DELETE constraint'
          }
        });
        
      } catch (error) {
        console.error("❌ Error during cleanup:", error);
        res.status(500).json({ 
          success: false,
          error: (error as any).message 
        });
      }
    });

    // Admin: Direct auction inspection endpoint (for debugging)
    app.get("/api/admin/auctions/inspect", async (req, res) => {
      try {
        const auctions = await pool.query('SELECT id, product_id, starting_price, start_time, status FROM auctions ORDER BY id LIMIT 20');
        const products = await pool.query('SELECT id, name FROM products');
        
        res.json({
          auctions: auctions.rows,
          products: products.rows,
          message: `${auctions.rows.length} auctions found, product_ids: ${auctions.rows.map(a => a.product_id).join(', ')}`
        });
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });

    // Admin: Force cleanup with TRUNCATE (nuclear option)
    app.post("/api/admin/cleanup/auctions-force", async (req, res) => {
      try {
        console.log("💥 [ADMIN] FORCE cleanup - truncating auctions table");
        
        // Disable constraint temporarily to allow truncate
        await pool.query('ALTER TABLE auctions DISABLE TRIGGER ALL');
        
        // Truncate
        const truncateRes = await pool.query('TRUNCATE auctions CASCADE');
        
        // Re-enable constraints
        await pool.query('ALTER TABLE auctions ENABLE TRIGGER ALL');
        
        console.log("✅ Auctions table truncated");
        
        res.json({
          success: true,
          message: "✅ All auctions cleared (FORCE method)",
          result: truncateRes
        });
      } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ 
          success: false,
          error: (error as any).message 
        });
      }
    });

    // Admin: Cleanup status with raw SQL results
    app.get("/api/admin/cleanup/status", async (req, res) => {
      try {
        console.log("📊 [ADMIN] Checking cleanup status...");
        
        // Count total auctions
        const totalRes = await pool.query('SELECT COUNT(*) as count FROM auctions');
        const totalCount = totalRes.rows[0].count;
        
        // Count orphaned auctions
        const orphanedRes = await pool.query(`
          SELECT a.id, a.product_id FROM auctions a
          LEFT JOIN products p ON a.product_id = p.id
          WHERE p.id IS NULL
        `);
        const orphanedCount = orphanedRes.rows.length;
        
        // Check for valid auctions
        const validRes = await pool.query(`
          SELECT COUNT(DISTINCT a.id) as count FROM auctions a
          JOIN products p ON a.product_id = p.id
        `);
        const validCount = validRes.rows[0].count;
        
        // Check constraint status
        const constraintRes = await pool.query(`
          SELECT constraint_name FROM information_schema.table_constraints
          WHERE table_name='auctions' 
          AND constraint_type='FOREIGN KEY'
          AND constraint_name='auctions_product_id_fkey'
        `);
        const hasConstraint = constraintRes.rows.length > 0;
        
        res.json({
          success: true,
          status: {
            totalAuctions: totalCount,
            validAuctions: validCount,
            orphanedAuctions: orphanedCount,
            isClean: orphanedCount === 0
          },
          constraint: {
            exists: hasConstraint,
            name: 'auctions_product_id_fkey',
            type: 'FOREIGN KEY',
            cascadeDelete: hasConstraint
          },
          recommendation: orphanedCount > 0 
            ? `Run POST /api/admin/cleanup/orphaned-auctions to remove ${orphanedCount} orphaned records`
            : 'Database is clean!'
        });
        
      } catch (error) {
        console.error("❌ Error checking status:", error);
        res.status(500).json({ 
          success: false,
          error: (error as any).message 
        });
      }
    });

    // IMPORTANT: Serve static files AFTER all API routes to avoid conflicts
    // Serve uploads directory (for product images and downloads)
    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
      maxAge: '1d',
      setHeaders: (res) => {
        // Images accessed for download - no cache
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }));
    
    // Only serve dist assets if dist folder exists (production mode)
    if (!isDev) {
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
    }

    // Catch-all route - serve index.html for all non-API, non-file requests (SPA routing)
    // Admin endpoint: Recalculate customer debt from transactions
    app.post('/api/admin/recalculate-debt', async (req, res) => {
      try {
        console.log('🔄 Recalculating customer debts...');
        
        // Get all topup store customers
        const customersResult = await pool.query(`
          SELECT id, name, phone, starting_balance, current_debt
          FROM customers
          WHERE store_id = (SELECT id FROM stores WHERE store_type = 'topup' LIMIT 1)
          ORDER BY created_at DESC
        `);
        
        console.log(`📊 Found ${customersResult.rows.length} customers`);
        
        const updates: any[] = [];
        
        // Calculate correct debt for each customer
        for (const customer of customersResult.rows) {
          const customerId = customer.id;
          
          // Get opening balance (starting_balance - immutable)
          const openingBalance = Number(customer.starting_balance || 0);
          
          // Get all purchases
          const ordersResult = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_purchases
            FROM topup_orders
            WHERE customer_id = $1
          `, [customerId]);
          
          const totalPurchases = Number(ordersResult.rows[0]?.total_purchases || 0);
          
          // Get all payments
          const paymentsResult = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as total_payments
            FROM customer_payments
            WHERE customer_id = $1
          `, [customerId]);
          
          const totalPayments = Number(paymentsResult.rows[0]?.total_payments || 0);
          
          // Calculate correct debt: opening_balance + purchases - payments
          const correctDebt = Math.max(0, openingBalance + totalPurchases - totalPayments);
          
          console.log(`👤 ${customer.name} (${customer.phone}): opening=${openingBalance}, purchases=${totalPurchases}, payments=${totalPayments}, calculated=${correctDebt}, old=${customer.current_debt}`);
          
          // Update if different
          if (Math.abs(correctDebt - customer.current_debt) > 0.01) {
            await pool.query(`
              UPDATE customers
              SET current_debt = $1
              WHERE id = $2
            `, [correctDebt, customerId]);
            
            updates.push({
              id: customerId,
              name: customer.name,
              oldDebt: customer.current_debt,
              newDebt: correctDebt,
              openingBalance,
              totalPurchases,
              totalPayments
            });
            
            console.log(`✅ Updated ${customer.name}: ${customer.current_debt} → ${correctDebt}`);
          }
        }
        
        res.json({
          success: true,
          message: `✅ Recalculated debt for ${updates.length} customers`,
          updates: updates
        });
      } catch (error) {
        console.error('❌ Error recalculating debt:', error);
        res.status(500).json({ error: 'Failed to recalculate debt', details: (error as any).message });
      }
    });

    // Only serve HTML to browser requests, return 404 for API calls
    app.use("*", (req, res) => {
      // If it's an API route that wasn't caught above, return 404
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found", path: req.path });
      }
      
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // In dev mode, redirect to Vite dev server (requires NODE_ENV != production)
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv !== 'production') {
        // Development: redirect to local Vite server
        return res.redirect('http://localhost:5173/');
      }
      
      // Production: serve built files
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    const PORT = Number.parseInt(process.env.PORT || "3000", 10);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on 0.0.0.0:${PORT}`);
      console.log(`📡 [PRODUCTION] Database connected via DATABASE_URL`);
    });

    cleanupSoldAuctionImages().catch((error) => {
      console.error('❌ Initial sold auction image cleanup failed:', error);
    });

    setInterval(() => {
      cleanupSoldAuctionImages().catch((error) => {
        console.error('❌ Scheduled sold auction image cleanup failed:', error);
      });
    }, 24 * 60 * 60 * 1000);
    
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

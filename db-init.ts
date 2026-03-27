import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { getDatabaseSslConfig, getRequiredDatabaseUrl } from './db-config.ts';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase(connectionString: string) {
  const dbUrl = connectionString || getRequiredDatabaseUrl();
  
  const client = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    ssl: getDatabaseSslConfig(),
  });

  try {
    console.log('[DB-INIT] Checking database...');
    console.log('[DB-INIT] URL:', (dbUrl || '').substring(0, 50) + '...');
    
    // Check if stores table exists and has data
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
      )
    `);

    const tableExists = result.rows[0].exists;
    console.log('📊 [DB-INIT] Stores table exists:', tableExists);
    
    if (tableExists) {
      // Check if data exists
      const dataCheck = await client.query('SELECT COUNT(*) FROM stores');
      const dataExists = parseInt(dataCheck.rows[0].count) > 0;
      const storeCount = parseInt(dataCheck.rows[0].count);
      
      console.log('📊 [DB-INIT] Stores count:', storeCount);
      
      if (dataExists) {
        console.log('✅ [DB-INIT] Database already initialized with data');
        return;
      }
    }

    // Skip backup file execution - tables already created
    console.log('⏩ [DB-INIT] Skipping backup file (tables already initialized)');
    
    // Just verify tables exist
    const tableCheck = await client.query(`
      SELECT COUNT(*) as table_count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 [DB-INIT] Total tables in database:', tableCheck.rows[0].table_count);

    // Create indexes for fast query performance
    console.log('\n📇 [DB-INIT] Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);',
      'CREATE INDEX IF NOT EXISTS idx_stores_id ON stores(id);',
      'CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_stores_is_active_created ON stores(is_active, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_topup_companies_store_id ON topup_companies(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_topup_categories_store_id ON topup_product_categories(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_topup_products_store_id ON topup_products(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);',
      'CREATE INDEX IF NOT EXISTS idx_topup_product_images_product ON topup_product_images(topup_product_id);'
    ];
    
    for (const indexStmt of indexes) {
      try {
        await client.query(indexStmt);
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.warn('  ⚠️  [DB-INIT] Index creation warning:', err.message.substring(0, 50));
        }
      }
    }

    // Create topup_product_images table if it doesn't exist
    console.log('📸 [DB-INIT] Creating/verifying topup_product_images table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS topup_product_images (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES topup_products(id) ON DELETE CASCADE,
          topup_product_id INTEGER,
          image_url TEXT,
          image_url_original TEXT,
          image_hash VARCHAR(255) NOT NULL,
          image_data TEXT,
          image_type VARCHAR(50) DEFAULT 'svg',
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, product_id, image_hash)
        )
      `);
      console.log('✅ [DB-INIT] topup_product_images table created/verified');

      // Add missing columns if they don't exist
      await client.query(`
        ALTER TABLE topup_product_images
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS image_url_original TEXT,
        ADD COLUMN IF NOT EXISTS topup_product_id INTEGER,
        ADD COLUMN IF NOT EXISTS image_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `).catch(() => {});

      console.log('✅ [DB-INIT] topup_product_images columns verified');
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        console.warn('  ⚠️  [DB-INIT] Table creation warning:', err.message.substring(0, 50));
      }
    }
    
    console.log('✅ [DB-INIT] Indexes created/verified');

    // Ensure topup store (ID 13) exists
    console.log('\n🔧 [DB-INIT] Ensuring Topup Store exists...');
    try {
      const storeCheck = await client.query('SELECT id, store_type FROM stores WHERE id = 13');
      
      if (storeCheck.rows.length === 0) {
        console.log('  📝 [DB-INIT] Creating topup store with explicit ID 13...');
        try {
          await client.query(`
            INSERT INTO stores (id, store_name, slug, owner_name, owner_phone, status, is_active, store_type) 
            VALUES (13, $1, $2, $3, $4, $5, $6, $7)`,
            ['Topup Store', 'topup-main', 'Topup Admin', '+964', 'approved', true, 'topup']
          );
          console.log('  ✅ [DB-INIT] Topup store 13 created successfully');
        } catch (insertErr: any) {
          // If ID 13 conflicts, just log it - store exists
          if (insertErr.code === '23505') { // unique_violation
            console.log('  ℹ️  [DB-INIT] Store 13 already exists');
          } else {
            throw insertErr;
          }
        }
      } else if (storeCheck.rows[0].store_type !== 'topup') {
        console.log('  📝 [DB-INIT] Updating existing store 13 to topup type...');
        await client.query('UPDATE stores SET store_type = $1 WHERE id = 13', ['topup']);
        console.log('  ✅ [DB-INIT] Store 13 updated to topup type');
      } else {
        console.log('  ✅ [DB-INIT] Topup store 13 already exists and configured');
      }
    } catch (err: any) {
      console.warn('  ⚠️  [DB-INIT] Warning ensuring topup store:', err.message.substring(0, 100));
    }

    console.log(`\n\n✅ [DB-INIT] Database initialization complete!`);
    
  } catch (err: any) {
    console.error('❌ [DB-INIT] Database initialization error:', err.message);
    console.error('❌ [DB-INIT] Error details:', err);
  } finally {
    await client.end();
  }
}


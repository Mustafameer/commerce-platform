import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase(connectionString: string) {
  // If connectionString is empty or invalid, use Railway hardcoded connection
  if (!connectionString || !connectionString.includes("@")) {
    connectionString = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';
    console.log('ℹ️  [DB-INIT] Using Railway hardcoded connection');
  }
  
  const client = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔍 [DB-INIT] Checking if database is initialized...');
    console.log('🔌 [DB-INIT] Connection string:', connectionString.substring(0, 50) + '...');
    
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

    console.log('📂 [DB-INIT] Loading database backup...');
    const backupPath = path.join(__dirname, 'database_backup.sql');
    console.log('📁 [DB-INIT] Backup file path:', backupPath);
    
    if (!fs.existsSync(backupPath)) {
      console.log('⚠️  [DB-INIT] No backup file found, skipping initialization');
      return;
    }

    console.log('✓ [DB-INIT] Backup file found, reading content...');
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    console.log('✓ [DB-INIT] Backup size:', (backupContent.length / 1024).toFixed(2), 'KB');
    
    // Split by lines to handle multi-line statements better
    const lines = backupContent.split('\n');
    let currentStatement = '';
    const statements: string[] = [];
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('--') || line.trim().length === 0) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Check if statement ends with semicolon
      if (line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`🚀 [DB-INIT] Executing ${statements.length} SQL statements...`);
    
    let count = 0;
    let successCount = 0;
    let skippedCount = 0;
    
    for (const statement of statements) {
      count++;
      try {
        if (statement.length === 0) continue;
        
        process.stdout.write(`\r⏳ [DB-INIT] Executing statement ${count}/${statements.length}...`);
        await client.query(statement);
        successCount++;
        
        if (count % 20 === 0) {
          console.log(`\n  ✓ [DB-INIT] ${count}/${statements.length} processed (${successCount} successful)`);
        }
      } catch (err: any) {
        // Ignore common non-critical errors
        const errMsg = err.message || '';
        if (
          errMsg.includes('already exists') ||
          errMsg.includes('duplicate key') ||
          errMsg.includes('violates unique constraint')
        ) {
          skippedCount++;
        } else {
          console.warn(`\n  ⚠️  [DB-INIT] Statement ${count} error: ${errMsg.substring(0, 80)}`);
        }
      }
    }

    // Create indexes for fast query performance
    console.log('\n📇 [DB-INIT] Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);',
      'CREATE INDEX IF NOT EXISTS idx_stores_id ON stores(id);',
      'CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_stores_is_active_created ON stores(is_active, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_topup_stores_slug ON topup_stores(slug);',
      'CREATE INDEX IF NOT EXISTS idx_topup_companies_store_id ON topup_companies(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_topup_categories_store_id ON topup_product_categories(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_topup_products_store_id ON topup_products(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);'
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
    console.log('✅ [DB-INIT] Indexes created/verified');

    console.log(`\n\n✅ [DB-INIT] Database initialization complete!`);
    console.log(`📊 [DB-INIT] Statements: ${successCount} executed, ${skippedCount} skipped (already exist)`);
    
  } catch (err: any) {
    console.error('❌ [DB-INIT] Database initialization error:', err.message);
    console.error('❌ [DB-INIT] Error details:', err);
  } finally {
    await client.end();
  }
}


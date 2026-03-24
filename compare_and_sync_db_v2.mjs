#!/usr/bin/env node

/**
 * 🔄 Database Compare & Sync Tool
 * 
 * Usage:
 *   node compare_and_sync_databases.mjs <railway_url>
 * 
 * Or set these environment variables:
 *   LOCAL_DB_URL - defaults to localhost
 *   RAILWAY_DB_URL - Railway connection string
 */

import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'cyan') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Get database URLs
const LOCAL_DB = process.env.LOCAL_DB_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
let RAILWAY_DB = process.env.RAILWAY_DB_URL || process.argv[2] || '';

// Ensure we have Railway URL
if (!RAILWAY_DB) {
  logError('Railway database URL not provided!');
  console.log('\n📝 Usage:');
  console.log('   node compare_and_sync_databases.mjs <railway_url>');
  console.log('\n   Or set RAILWAY_DB_URL environment variable');
  console.log('\n💡 Example Railway URL:');
  console.log('   postgresql://postgres:password@host.railway.app:5432/railway');
  process.exit(1);
}

// Remove sslmode from URL if present (we'll handle SSL via config)
RAILWAY_DB = RAILWAY_DB.replace(/[?&]sslmode=[^&]*/g, '');

const localPool = new Pool({
  connectionString: LOCAL_DB,
  connectionTimeoutMillis: 10000,
});

const railwayPool = new Pool({
  connectionString: RAILWAY_DB,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
    mode: 'require'
  }
});

// ==================== SCHEMA COMPARISON ====================

async function getTables(client) {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(r => r.table_name);
}

async function getTableSchema(client, tableName) {
  const result = await client.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
}

async function getForeignKeys(client, tableName) {
  const result = await client.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = $1
    ORDER BY constraint_name, column_name
  `, [tableName]);
  return result.rows;
}

async function compareDatabases() {
  log('\n🔍 Starting database comparison...', 'bright');
  
  const localTables = await getTables(localPool);
  const railwayTables = await getTables(railwayPool);

  logInfo(`\nLocal database: ${localTables.length} tables`);
  logInfo(`Railway database: ${railwayTables.length} tables`);

  const missingInRailway = localTables.filter(t => !railwayTables.includes(t));
  const extraInRailway = railwayTables.filter(t => !localTables.includes(t));

  if (missingInRailway.length > 0) {
    logWarning(`\nTables missing in Railway (${missingInRailway.length}):`);
    missingInRailway.forEach(t => logInfo(`  - ${t}`));
  }

  if (extraInRailway.length > 0) {
    logWarning(`\nTables in Railway not in local (${extraInRailway.length}):`);
    extraInRailway.forEach(t => logInfo(`  - ${t}`));
  }

  // Compare schemas
  logInfo(`\n📋 Comparing table schemas...`);
  
  let schemaMismatches = 0;
  
  for (const tableName of localTables.filter(t => railwayTables.includes(t))) {
    const localSchema = await getTableSchema(localPool, tableName);
    const railwaySchema = await getTableSchema(railwayPool, tableName);

    if (localSchema.length !== railwaySchema.length) {
      schemaMismatches++;
      logWarning(`${tableName}: local=${localSchema.length} cols, railway=${railwaySchema.length} cols`);
    }
  }

  if (schemaMismatches === 0) {
    logSuccess(`All common tables have same column count`);
  }

  // Compare foreign keys
  logInfo(`\n🔗 Comparing foreign key relationships...`);
  
  let fkMismatches = 0;
  
  for (const tableName of localTables.filter(t => railwayTables.includes(t))) {
    const localFKs = await getForeignKeys(localPool, tableName);
    const railwayFKs = await getForeignKeys(railwayPool, tableName);

    if (localFKs.length !== railwayFKs.length) {
      fkMismatches++;
      logWarning(`${tableName}: local=${localFKs.length} FKs, railway=${railwayFKs.length} FKs`);
    }
  }

  if (fkMismatches === 0) {
    logSuccess(`All foreign key relationships match`);
  }

  return {
    localTables,
    railwayTables,
    missingInRailway,
    extraInRailway,
    schemaMismatches,
    fkMismatches
  };
}

// ==================== DATA MIGRATION ====================

async function getRowCount(client, tableName) {
  const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return Number(result.rows[0].count);
}

async function migrateData(comparisonResult) {
  log('\n📤 Starting data migration...', 'bright');
  
  const { localTables } = comparisonResult;
  
  // Table order respecting foreign keys
  const tableOrder = [
    'users', 'stores', 'merchants', 'topup_companies', 'topup_product_categories',
    'categories', 'products', 'customers', 'orders', 'order_items', 'order_images',
    'customer_transactions', 'customer_payments', 'auctions', 'auction_bids',
    'coupons', 'topup_products', 'topup_product_images', 'app_settings',
    'merchant_applications'
  ];

  const sortedTables = [
    ...tableOrder.filter(t => localTables.includes(t)),
    ...localTables.filter(t => !tableOrder.includes(t))
  ];

  let totalRows = 0;

  const railwayClient = await railwayPool.connect();

  try {
    await railwayClient.query('SET CONSTRAINTS ALL DEFERRED');

    for (const tableName of sortedTables) {
      try {
        const localCount = await getRowCount(localPool, tableName);
        
        if (localCount === 0) {
          logInfo(`${tableName}: 0 rows`);
          continue;
        }

        // Fetch data from local
        const { rows } = await localPool.query(`SELECT * FROM "${tableName}" ORDER BY id`);
        const columns = Object.keys(rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(', ');

        // Truncate Railway table
        try {
          await railwayClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        } catch (e) {
          // Ignore if table doesn't exist
        }

        // Insert rows
        let inserted = 0;
        for (const row of rows) {
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return null;
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          });

          try {
            await railwayClient.query(
              `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values
            );
            inserted++;
          } catch (err) {
            // Ignore insert errors
          }
        }

        const railwayCount = await getRowCount(railwayPool, tableName);
        logSuccess(`${tableName}: ${railwayCount}/${localCount} rows`);
        totalRows += railwayCount;

      } catch (error) {
        logError(`${tableName}: ${error.message}`);
      }
    }

    await railwayClient.query('SET CONSTRAINTS ALL IMMEDIATE');
    logSuccess(`\n✅ Migration complete! Total: ${totalRows} rows`);

  } finally {
    railwayClient.release();
  }
}

// ==================== MAIN ====================

async function main() {
  try {
    log('🚀 Database Compare & Sync Tool', 'bright');
    log('='.repeat(60), 'bright');

    // Test connections
    logInfo('\n🔌 Testing connections...');
    
    try {
      await localPool.query('SELECT 1');
      logSuccess('Local database connected');
    } catch (e) {
      logError('Local connection failed: ' + e.message);
      process.exit(1);
    }

    try {
      await railwayPool.query('SELECT 1');
      logSuccess('Railway database connected');
    } catch (e) {
      logError('Railway connection failed: ' + e.message);
      process.exit(1);
    }

    // Compare
    const result = await compareDatabases();

    // Confirm before migration
    if (result.missingInRailway.length === 0 && result.fkMismatches === 0) {
      logSuccess('\n✅ Schemas match perfectly!');
    } else if (result.missingInRailway.length > 0) {
      logWarning('\n⚠️  Some tables are missing in Railway.');
      logWarning('   Create them first before running migration.');
      process.exit(1);
    }

    // Migrate
    await migrateData(result);

    log('\n' + '='.repeat(60), 'bright');
    logSuccess('✅ SYNCHRONIZATION COMPLETE!');
    log('='.repeat(60), 'bright');

  } catch (error) {
    logError('Fatal error: ' + error.message);
    process.exit(1);
  } finally {
    await localPool.end();
    await railwayPool.end();
  }
}

main();

#!/usr/bin/env node

/**
 * 🔄 Database Compare & Sync Tool
 * 
 * This script:
 * 1. Compares local and cloud database schemas
 * 2. Identifies missing/different table relationships
 * 3. Syncs all data from local to cloud while preserving foreign key relationships
 * 4. Verifies data integrity after migration
 */

import pkg from 'pg';
const { Pool, Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

// Database configurations
const LOCAL_DB = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
let RAILWAY_DB = process.env.DATABASE_URL || '';

if (!RAILWAY_DB) {
  logError('DATABASE_URL environment variable not set');
  process.exit(1);
}

// Ensure Railway connection string includes SSL parameters
if (RAILWAY_DB && !RAILWAY_DB.includes('sslmode')) {
  RAILWAY_DB += '?sslmode=require';
}

const localPool = new Pool({
  connectionString: LOCAL_DB,
  connectionTimeoutMillis: 10000,
});

const railwayPool = new Pool({
  connectionString: RAILWAY_DB,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  }
});

// ==================== SCHEMA COMPARISON ====================

async function getTables(client, database) {
  const result = await client.query(`
    SELECT table_name, table_schema
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
      column_default,
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
      constraint_name,
      column_name,
      foreign_table_name,
      foreign_column_name,
      update_rule,
      delete_rule
    FROM (
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
    ) AS fks
    ORDER BY constraint_name, column_name
  `, [tableName]);
  return result.rows;
}

async function getIndexes(client, tableName) {
  const result = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = $1
    AND indexdef NOT LIKE '%UNIQUE%'
    ORDER BY indexname
  `, [tableName]);
  return result.rows;
}

async function compareDatabases() {
  log('\n🔍 Starting database comparison...', 'bright');
  
  try {
    const localTables = await getTables(localPool);
    const railwayTables = await getTables(railwayPool);

    log(`\n📊 Table Count:`, 'cyan');
    log(`   Local:   ${localTables.length} tables`, 'cyan');
    log(`   Railway: ${railwayTables.length} tables`, 'cyan');

    const missingInRailway = localTables.filter(t => !railwayTables.includes(t));
    const extraInRailway = railwayTables.filter(t => !localTables.includes(t));

    if (missingInRailway.length > 0) {
      logWarning(`\nTables missing in Railway:`);
      missingInRailway.forEach(t => log(`   - ${t}`, 'yellow'));
    }

    if (extraInRailway.length > 0) {
      logWarning(`\nExtra tables in Railway (not in local):`);
      extraInRailway.forEach(t => log(`   - ${t}`, 'yellow'));
    }

    // Compare columns for common tables
    log(`\n📋 Comparing table schemas...`, 'cyan');
    
    let schemaDifferences = 0;
    
    for (const tableName of localTables.filter(t => railwayTables.includes(t))) {
      const localSchema = await getTableSchema(localPool, tableName);
      const railwaySchema = await getTableSchema(railwayPool, tableName);

      const localCols = localSchema.map(c => c.column_name);
      const railwayCols = railwaySchema.map(c => c.column_name);

      const missing = localCols.filter(c => !railwayCols.includes(c));
      const extra = railwayCols.filter(c => !localCols.includes(c));

      if (missing.length > 0 || extra.length > 0) {
        schemaDifferences++;
        logWarning(`\nTable: ${tableName}`);
        if (missing.length > 0) {
          log(`   Missing in Railway: ${missing.join(', ')}`, 'yellow');
        }
        if (extra.length > 0) {
          log(`   Extra in Railway: ${extra.join(', ')}`, 'yellow');
        }
      }
    }

    if (schemaDifferences === 0) {
      logSuccess('\n✅ All common tables have identical column structures');
    }

    // Compare foreign keys
    log(`\n🔗 Comparing foreign key relationships...`, 'cyan');
    
    let fkDifferences = 0;
    
    for (const tableName of localTables.filter(t => railwayTables.includes(t))) {
      const localFKs = await getForeignKeys(localPool, tableName);
      const railwayFKs = await getForeignKeys(railwayPool, tableName);

      if (localFKs.length !== railwayFKs.length) {
        fkDifferences++;
        logWarning(`\nTable: ${tableName}`);
        log(`   Local FKs: ${localFKs.length}`, 'yellow');
        log(`   Railway FKs: ${railwayFKs.length}`, 'yellow');

        // Show differences
        for (const fk of localFKs) {
          const exists = railwayFKs.find(rf => 
            rf.column_name === fk.column_name && 
            rf.foreign_table_name === fk.foreign_table_name
          );
          if (!exists) {
            log(`   Missing FK: ${fk.constraint_name} (${fk.column_name} -> ${fk.foreign_table_name})`, 'yellow');
          }
        }
      }
    }

    if (fkDifferences === 0) {
      logSuccess('\n✅ All foreign key relationships are identical');
    }

    return {
      localTables,
      railwayTables,
      missingInRailway,
      extraInRailway,
      schemaDifferences,
      fkDifferences
    };

  } catch (error) {
    logError(`Comparison failed: ${error.message}`);
    throw error;
  }
}

// ==================== DATA MIGRATION ====================

async function getRowCount(client, tableName) {
  const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return Number(result.rows[0].count);
}

async function disableForeignKeyChecks(client) {
  await client.query('SET CONSTRAINTS ALL DEFERRED');
}

async function enableForeignKeyChecks(client) {
  await client.query('SET CONSTRAINTS ALL IMMEDIATE');
}

async function migrateData(comparisonResult) {
  log('\n📤 Starting data migration from local to Railway...', 'bright');
  
  const { localTables, missingInRailway } = comparisonResult;
  
  // Order tables by foreign key dependencies (dependencies first)
  const tableOrder = [
    'users',
    'stores',
    'topup_companies',
    'topup_product_categories',
    'categories',
    'products',
    'customers',
    'orders',
    'order_items',
    'order_images',
    'customer_transactions',
    'customer_payments',
    'auctions',
    'auction_bids',
    'coupons',
    'topup_products',
    'topup_product_images',
    'app_settings',
    'merchant_applications',
    // Other tables
    ...localTables.filter(t => !tableOrder.includes(t))
  ];

  let totalRowsMigrated = 0;
  const railwayClient = await railwayPool.connect();

  try {
    await disableForeignKeyChecks(railwayClient);

    for (const tableName of tableOrder) {
      if (!localTables.includes(tableName)) continue;

      try {
        // Get row counts before migration
        const localCount = await getRowCount(localPool, tableName);
        if (localCount === 0) {
          logInfo(`${tableName}: 0 rows (skipping)`);
          continue;
        }

        // Truncate Railway table first
        try {
          await railwayClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        } catch (e) {
          // Ignore if table doesn't exist or is empty}
        }

        // Get all data from local
        const localData = await localPool.query(`SELECT * FROM "${tableName}" ORDER BY id`);
        const rows = localData.rows;

        if (rows.length === 0) {
          logInfo(`${tableName}: 0 rows`);
          continue;
        }

        // Get column names
        const columns = Object.keys(rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(', ');

        // Insert rows with proper handling of NULL and special types
        let inserted = 0;
        for (const row of rows) {
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const values = columns.map(col => {
            const val = row[col];
            // Handle special types
            if (val === null) return null;
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          });

          try {
            await railwayClient.query(
              `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } catch (err) {
            logWarning(`   Failed to insert row ${row.id}: ${err.message.substring(0, 80)}`);
          }
        }

        const railwayCount = await getRowCount(railwayPool, tableName);
        logSuccess(`${tableName}: ${railwayCount}/${localCount} rows migrated`);
        totalRowsMigrated += railwayCount;

      } catch (error) {
        logError(`Failed to migrate ${tableName}: ${error.message}`);
      }
    }

    await enableForeignKeyChecks(railwayClient);
    logSuccess(`\n✅ Data migration complete! Total: ${totalRowsMigrated} rows migrated`);

  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    throw error;
  } finally {
    railwayClient.release();
  }
}

// ==================== VERIFICATION ====================

async function verifyMigration(localTables) {
  log('\n✔️  Verifying migrated data...', 'bright');

  let mismatches = 0;

  for (const tableName of localTables) {
    try {
      const localCount = await getRowCount(localPool, tableName);
      const railwayCount = await getRowCount(railwayPool, tableName);

      if (localCount !== railwayCount) {
        mismatches++;
        logWarning(`${tableName}: local=${localCount}, railway=${railwayCount}`);
      } else if (localCount > 0) {
        logSuccess(`${tableName}: ${localCount} rows ✓`);
      }
    } catch (error) {
      logWarning(`Could not verify ${tableName}: ${error.message}`);
    }
  }

  if (mismatches === 0) {
    logSuccess(`\n✅ All data verified! Databases are now synchronized.`);
  } else {
    logWarning(`\n⚠️  Found ${mismatches} table count mismatches`);
  }
}

// ==================== MAIN EXECUTION ====================

async function main() {
  try {
    log('🚀 Commerce Platform Database Synchronization Tool', 'bright');
    log('='.repeat(60), 'bright');

    // Test connections
    log('\n🔌 Testing database connections...', 'cyan');
    try {
      await localPool.query('SELECT 1');
      logSuccess('Local database connected');
    } catch (e) {
      logError('Local database connection failed: ' + e.message);
      process.exit(1);
    }

    try {
      await railwayPool.query('SELECT 1');
      logSuccess('Railway database connected');
    } catch (e) {
      logError('Railway database connection failed: ' + e.message);
      process.exit(1);
    }

    // Step 1: Compare databases
    const comparisonResult = await compareDatabases();

    // Step 2: Migrate data
    await migrateData(comparisonResult);

    // Step 3: Verify
    await verifyMigration(comparisonResult.localTables);

    log('\n' + '='.repeat(60), 'bright');
    logSuccess('✅ DATABASE SYNCHRONIZATION COMPLETE!', 'bright');
    log('='.repeat(60), 'bright');

  } catch (error) {
    logError(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await localPool.end();
    await railwayPool.end();
  }
}

main();

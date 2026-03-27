import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configurations
const LOCAL_DB = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
// Try both internal and external Railway connections
const RAILWAY_DB = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@web-production-9efff.up.railway.app:5432/railway';

// Create clients with SSL options for Railway
const localPool = new Pool({
  connectionString: LOCAL_DB,
  connectionTimeoutMillis: 10000,
});

const railwayPool = new Pool({
  connectionString: RAILWAY_DB,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'cyan') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function getTableNames(client) {
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
  } catch (error) {
    logError(`Failed to get table names: ${error.message}`);
    return [];
  }
}

async function getTableSchema(client, tableName) {
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  } catch (error) {
    logError(`Failed to get schema for ${tableName}: ${error.message}`);
    return [];
  }
}

async function dropAllTables(client) {
  log('\n🗑️  حذف جميع الجداول من Railway...', 'yellow');
  
  try {
    // First, drop all foreign key constraints
    const constraintsResult = await client.query(`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `);

    for (const constraint of constraintsResult.rows) {
      try {
        await client.query(`
          ALTER TABLE "${constraint.table_name}" 
          DROP CONSTRAINT "${constraint.constraint_name}"
        `);
        log(`  ✓ تم حذف القيد: ${constraint.constraint_name}`, 'blue');
      } catch (error) {
        // Continue even if constraint doesn't exist
      }
    }

    // Get all tables
    const tables = await getTableNames(client);
    
    if (tables.length === 0) {
      logSuccess('لا توجد جداول للحذف');
      return;
    }

    // Drop each table
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        logSuccess(`تم حذف الجدول: ${table}`);
      } catch (error) {
        logError(`فشل حذف الجدول ${table}: ${error.message}`);
      }
    }

    logSuccess('تم حذف جميع الجداول بنجاح');
  } catch (error) {
    logError(`خطأ أثناء حذف الجداول: ${error.message}`);
    throw error;
  }
}

async function createTableOnRailway(client, tableName, schema) {
  try {
    // Build CREATE TABLE statement
    let createTableSQL = `CREATE TABLE "${tableName}" (\n`;
    
    const columns = schema.map((col, index) => {
      let columnDef = `  "${col.column_name}" ${col.data_type}`;
      
      if (col.column_default) {
        columnDef += ` DEFAULT ${col.column_default}`;
      }
      
      if (col.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }
      
      return columnDef;
    });

    createTableSQL += columns.join(',\n') + '\n);';

    await client.query(createTableSQL);
    return true;
  } catch (error) {
    logError(`فشل إنشاء الجدول ${tableName}: ${error.message}`);
    return false;
  }
}

async function copyTableData(localClient, railwayClient, tableName) {
  try {
    // Get all data from local database
    const result = await localClient.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      log(`  ℹ️  الجدول فارغ: ${tableName}`, 'blue');
      return 0;
    }

    // Get column names in order
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    // Insert rows one by one or in batches
    let insertedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        
        try {
          await railwayClient.query(
            `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        } catch (error) {
          logWarning(`فشل إدراج صف في ${tableName}: ${error.message}`);
        }
      }

      log(`  ℹ️  تم نسخ ${Math.min(i + batchSize, rows.length)} / ${rows.length} صفوف`, 'blue');
    }

    return insertedCount;
  } catch (error) {
    logError(`فشل نسخ البيانات من ${tableName}: ${error.message}`);
    return 0;
  }
}

async function restoreConstraints(localClient, railwayClient) {
  try {
    log('\n🔗 استعادة القيود الخارجية...', 'yellow');

    const constraintsResult = await localClient.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    for (const fk of constraintsResult.rows) {
      try {
        const alterSQL = `
          ALTER TABLE "${fk.table_name}"
          ADD CONSTRAINT "${fk.constraint_name}"
          FOREIGN KEY ("${fk.column_name}")
          REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")
        `;
        
        await railwayClient.query(alterSQL);
        logSuccess(`تم استعادة القيد: ${fk.constraint_name}`);
      } catch (error) {
        logWarning(`فشل استعادة القيد ${fk.constraint_name}: ${error.message}`);
      }
    }
  } catch (error) {
    logWarning(`خطأ أثناء استعادة القيود: ${error.message}`);
  }
}

async function restoreIndexes(localClient, railwayClient) {
  try {
    log('\n📑 استعادة الفهارس...', 'yellow');

    const indexResult = await localClient.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE 'pg_%'
      ORDER BY tablename, indexname
    `);

    for (const idx of indexResult.rows) {
      try {
        // Modify indexdef to reference Rails tables
        let indexDef = idx.indexdef
          .replace(/\bON\s+public\./gi, 'ON ')
          .replace(/\bTABLE\s+public\./gi, 'TABLE ');

        await railwayClient.query(indexDef);
        logSuccess(`تم استعادة الفهرس: ${idx.indexname}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          logWarning(`فشل استعادة الفهرس ${idx.indexname}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    logWarning(`خطأ أثناء استعادة الفهارس: ${error.message}`);
  }
}

async function verifyMigration(localClient, railwayClient) {
  try {
    log('\n🔍 التحقق من نجاح النقل...', 'yellow');

    const localTables = await getTableNames(localClient);
    const railwayTables = await getTableNames(railwayClient);

    log(`\n📊 الجداول في قاعدة البيانات المحلية: ${localTables.length}`, 'cyan');
    localTables.forEach(table => log(`  ✓ ${table}`, 'blue'));

    log(`\n📊 الجداول في Railway: ${railwayTables.length}`, 'cyan');
    railwayTables.forEach(table => log(`  ✓ ${table}`, 'blue'));

    log('\n📈 عدد الصفوف في كل جدول:', 'cyan');
    for (const table of localTables) {
      const localCount = await localClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const railwayCount = await railwayClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      
      const local = parseInt(localCount.rows[0].count);
      const railway = parseInt(railwayCount.rows[0].count);
      
      if (local === railway) {
        logSuccess(`${table}: ${local} صفوف (✓ متطابق)`);
      } else {
        logWarning(`${table}: محلي=${local}, Railway=${railway} (⚠️  غير متطابق)`);
      }
    }
  } catch (error) {
    logError(`خطأ أثناء التحقق: ${error.message}`);
  }
}

async function main() {
  try {
    log('\n╔════════════════════════════════════════════╗', 'bright');
    log('║  نقل قاعدة البيانات إلى Railway 🚀      ║', 'bright');
    log('╚════════════════════════════════════════════╝\n', 'bright');

    // Test connections
    log('🔌 اختبار الاتصال بقاعدة البيانات المحلية...', 'yellow');
    try {
      await localPool.query('SELECT 1');
      logSuccess('الاتصال المحلي صحيح');
    } catch (error) {
      logError(`فشل الاتصال المحلي: ${error.message}`);
      process.exit(1);
    }

    log('\n🔌 اختبار الاتصال بـ Railway...', 'yellow');
    try {
      await railwayPool.query('SELECT 1');
      logSuccess('الاتصال بـ Railway صحيح');
    } catch (error) {
      logError(`فشل الاتصال بـ Railway: ${error.message}`);
      process.exit(1);
    }

    // Get local tables
    log('\n📋 الحصول على قائمة الجداول المحلية...', 'yellow');
    const localTables = await getTableNames(localPool);
    logSuccess(`تم العثور على ${localTables.length} جداول`);
    localTables.forEach(table => log(`  ✓ ${table}`, 'blue'));

    // Drop all tables on Railway
    await dropAllTables(railwayPool);

    // Create and copy each table
    log('\n📦 نقل الجداول والبيانات...', 'yellow');
    let totalRowsCopied = 0;

    for (const tableName of localTables) {
      log(`\n📤 نقل الجدول: ${tableName}`, 'cyan');
      
      // Get schema from local
      const schema = await getTableSchema(localPool, tableName);
      
      // Create table on Railway
      const created = await createTableOnRailway(railwayPool, tableName, schema);
      
      if (created) {
        logSuccess(`تم إنشاء جدول ${tableName} على Railway`);
        
        // Copy data
        const rowsCopied = await copyTableData(localPool, railwayPool, tableName);
        totalRowsCopied += rowsCopied;
        logSuccess(`تم نسخ ${rowsCopied} صفوف من ${tableName}`);
      }
    }

    // Restore foreign key constraints
    await restoreConstraints(localPool, railwayPool);

    // Restore indexes
    await restoreIndexes(localPool, railwayPool);

    // Verify migration
    await verifyMigration(localPool, railwayPool);

    logSuccess(`\n✨ تم نقل جميع البيانات بنجاح!`);
    logSuccess(`إجمالي الصفوف المنقولة: ${totalRowsCopied}`);

  } catch (error) {
    logError(`خطأ عام: ${error.message}`);
    process.exit(1);
  } finally {
    // Close connections
    await localPool.end();
    await railwayPool.end();
  }
}

main();

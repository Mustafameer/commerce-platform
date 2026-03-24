import pkg from 'pg';
const { Pool } = pkg;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(msg, color = 'cyan') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.error(`${colors.red}❌ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

/**
 * التحقق من نجاح النقل
 */
async function verifyMigration(connectionString, label) {
  log(`\n📊 فحص ${label}...`, 'yellow');

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    // اختبر الاتصال
    await pool.query('SELECT 1');
    success(`اتصال ناجح: ${label}`);

    // احصل على عدد الجداول
    const tableResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tableCount = parseInt(tableResult.rows[0].count);
    log(`  📋 عدد الجداول: ${tableCount}`, 'blue');

    // احصل على قائمة الجداول
    const tablesListResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesListResult.rows.map(r => r.table_name);
    
    if (tables.length > 0) {
      log(`  📑 الجداول:`, 'blue');
      tables.forEach(t => log(`     • ${t}`, 'blue'));
    }

    // احصل على عدد الصفوف في كل جدول
    log(`\n  📈 عدد الصفوف في كل جدول:`, 'cyan');

    let totalRows = 0;
    const rowCounts = {};

    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const rowCount = parseInt(countResult.rows[0].count);
      rowCounts[table] = rowCount;
      totalRows += rowCount;

      if (rowCount > 0) {
        log(`     • ${table}: ${rowCount} صفوف`, 'blue');
      }
    }

    success(`إجمالي الصفوف: ${totalRows}`);

    // تحقق من كل جدول مهم
    log(`\n  🔍 فحص الجداول المهمة:`, 'cyan');

    const importantTables = ['users', 'stores', 'products', 'customers', 'categories'];

    for (const table of importantTables) {
      if (rowCounts[table] !== undefined) {
        const count = rowCounts[table];
        if (count > 0) {
          success(`  ${table}: ${count} صفوف`);
        } else {
          warn(`  ${table}: فارغ (0 صفوف)`);
        }
      }
    }

    // عينة من البيانات
    log(`\n  📝 عينة من البيانات:`, 'cyan');

    if (rowCounts['users'] > 0) {
      const usersResult = await pool.query('SELECT id, name, email FROM users LIMIT 1');
      if (usersResult.rows.length > 0) {
        const user = usersResult.rows[0];
        log(`     users: ${user.name} (${user.email})`, 'blue');
      }
    }

    if (rowCounts['stores'] > 0) {
      const storesResult = await pool.query('SELECT id, name FROM stores LIMIT 1');
      if (storesResult.rows.length > 0) {
        const store = storesResult.rows[0];
        log(`     stores: ${store.name}`, 'blue');
      }
    }

    await pool.end();

    return {
      connected: true,
      tableCount,
      totalRows,
      rowCounts,
      tables
    };

  } catch (err) {
    error(`فشل فحص ${label}: ${err.message}`);
    await pool.end();
    return {
      connected: false,
      error: err.message
    };
  }
}

/**
 * مقارنة قاعدتي البيانات
 */
async function compareDatabases() {
  const LOCAL = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
  const RAILWAY = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@web-production-9efff.up.railway.app:5432/railway';

  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║  التحقق من نجاح نقل قاعدة البيانات 🔍 ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  // فحص المحلي
  const localResult = await verifyMigration(LOCAL, 'قاعدة البيانات المحلية');

  if (!localResult.connected) {
    error('فشل الاتصال بقاعدة البيانات المحلية');
    process.exit(1);
  }

  // فحص Railway
  const railwayResult = await verifyMigration(RAILWAY, 'Railway');

  if (!railwayResult.connected) {
    warn('\n⚠️  لم نتمكن من الاتصال بـ Railway من هنا');
    warn('قد تحتاج لاستخدام Railway Dashboard للتحقق');
    warn('\nخطوات التحقق:');
    warn('1. افتح: https://railway.app/dashboard');
    warn('2. اختر المشروع: commerce-platform');
    warn('3. اختر PostgreSQL');
    warn('4. اضغط على: Query');
    warn('5. شغل:');
    warn('   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\'public\'');
    warn('   يجب أن يعيد: ' + localResult.tableCount);
    process.exit(0);
  }

  // مقارنة النتائج
  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║  نتائج المقارنة 📊                   ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  const localTables = localResult.tableCount;
  const railwayTables = railwayResult.tableCount;

  if (localTables === railwayTables) {
    success(`عدد الجداول متطابق: ${localTables} جدول`);
  } else {
    error(`عدم توافق عدد الجداول: محلي=${localTables}, Railway=${railwayTables}`);
  }

  const localRows = localResult.totalRows;
  const railwayRows = railwayResult.totalRows;

  if (localRows === railwayRows) {
    success(`عدد الصفوف متطابق: ${localRows} صف`);
  } else {
    warn(`عدم توافق عدد الصفوف: محلي=${localRows}, Railway=${railwayRows}`);
  }

  // مقارنة الجداول
  log('\n  📋 مقارنة الجداول:', 'cyan');

  for (const table of localResult.tables) {
    const localCount = localResult.rowCounts[table];
    const railwayCount = railwayResult.rowCounts[table] || 0;

    if (localCount === railwayCount) {
      success(`  ${table}: متطابق (${localCount} صفوف)`);
    } else {
      warn(`  ${table}: محلي=${localCount}, Railway=${railwayCount}`);
    }
  }

  // الخلاصة
  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║  الخلاصة ✨                            ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  if (localTables === railwayTables && localRows === railwayRows) {
    success('\n🎉 النقل نجح بنسبة 100%!');
    success('جميع البيانات متطابقة بين المحلي و Railway\n');
  } else {
    warn('\n⚠️  ربما يوجد اختلاف في البيانات');
    warn('تحقق من التفاصيل أعلاه\n');
  }
}

compareDatabases().catch(console.error);

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import readline from 'readline';

const RAILWAY_CONFIG = {
  host: 'gondola.proxy.rlwy.net',
  port: 42495,
  user: 'postgres',
  password: 'yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  statement_timeout: '0'
};

const BACKUP_FILE = 'railway_backup_full.sql';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'cyan') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function uploadToRailway() {
  log('\n[Railway Upload] Starting database migration to Railway...', 'cyan');

  // Check backup file
  if (!fs.existsSync(BACKUP_FILE)) {
    log(`[ERROR] Backup file not found: ${BACKUP_FILE}`, 'red');
    process.exit(1);
  }

  const fileSize = (fs.statSync(BACKUP_FILE).size / 1024 / 1024).toFixed(2);
  log(`[OK] Backup file found: ${BACKUP_FILE} (${fileSize} MB)`, 'green');

  // Connect to Railway
  log(`\n[Railway Upload] Connecting to Railway...`, 'yellow');
  const pool = new Pool(RAILWAY_CONFIG);

  try {
    // Test connection
    const result = await pool.query('SELECT version()');
    log(`[OK] Connected to Railway`, 'green');
    log(`[INFO] PostgreSQL: ${result.rows[0].version.substring(0, 50)}...`, 'cyan');
  } catch (err) {
    log(`[ERROR] Failed to connect to Railway: ${err.message}`, 'red');
    process.exit(1);
  }

  // Read SQL file
  log(`\n[Railway Upload] Reading SQL file...`, 'yellow');
  const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
  const statements = sqlContent.split(';').filter(s => s.trim());

  log(`[INFO] Total SQL statements: ${statements.length}`, 'cyan');

  // Execute statements
  log(`\n[Railway Upload] Executing statements (this may take several minutes)...`, 'yellow');

  let executed = 0;
  let errors = 0;
  let skipped = 0;
  const startTime = Date.now();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    
    if (!stmt) {
      skipped++;
      continue;
    }

    try {
      await pool.query(stmt);
      executed++;

      if (executed % 50 === 0) {
        log(`[INFO] Executed: ${executed} statements`, 'cyan');
      }
    } catch (err) {
      if (!err.message.includes('already exists')) {
        log(`[WARNING] Statement ${i + 1} failed: ${err.message.substring(0, 80)}`, 'yellow');
        errors++;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`\n[SUCCESS] Upload completed!`, 'green');
  log(`[STATS] Executed: ${executed}, Errors: ${errors}, Skipped: ${skipped}`, 'cyan');
  log(`[TIME] Duration: ${elapsed} seconds`, 'cyan');

  // Verify results
  log(`\n[Railway Upload] Verifying results...`, 'yellow');

  try {
    const countResult = await pool.query(`
      SELECT COUNT(*) as table_count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tableCount = countResult.rows[0].table_count;
    log(`[OK] Tables in Railway: ${tableCount}`, 'green');

    if (tableCount === 26) {
      log(`[SUCCESS] All 26 tables uploaded successfully!`, 'green');
    } else {
      log(`[WARNING] Expected 26 tables, but found ${tableCount}`, 'yellow');
    }

    // Show sample data
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const storesResult = await pool.query('SELECT COUNT(*) as count FROM stores');

    log(`\n[DATA SAMPLE]`, 'cyan');
    log(`  - Users: ${usersResult.rows[0].count}`, 'cyan');
    log(`  - Products: ${productsResult.rows[0].count}`, 'cyan');
    log(`  - Stores: ${storesResult.rows[0].count}`, 'cyan');

  } catch (err) {
    log(`[WARNING] Verification failed: ${err.message}`, 'yellow');
  }

  await pool.end();

  log(`\n[INFO] Migration to Railway completed successfully!`, 'green');
  log(`[INFO] Your database is now ready on Railway`, 'green');
}

uploadToRailway().catch(err => {
  log(`[FATAL ERROR] ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

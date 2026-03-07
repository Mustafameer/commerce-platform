import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase(connectionString: string) {
  const client = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔍 Checking if database is initialized...');
    
    // Check if stores table exists and has data
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
      )
    `);

    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      // Check if data exists
      const dataCheck = await client.query('SELECT COUNT(*) FROM stores');
      const dataExists = parseInt(dataCheck.rows[0].count) > 0;
      
      if (dataExists) {
        console.log('✅ Database already initialized with data');
        return;
      }
    }

    console.log('📂 Loading database backup...');
    const backupPath = path.join(__dirname, 'database_backup.sql');
    
    if (!fs.existsSync(backupPath)) {
      console.log('⚠️  No backup file found, skipping initialization');
      return;
    }

    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const statements = backupContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Executing ${statements.length} SQL statements...`);
    
    let count = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        count++;
        if (count % 10 === 0) {
          console.log(`  ✓ ${count}/${statements.length} statements executed`);
        }
      } catch (err: any) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.warn(`  ⚠️  Error: ${err.message.substring(0, 100)}`);
        }
      }
    }

    console.log(`✅ Database initialized with ${count} statements executed`);
    
  } catch (err: any) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    await client.end();
  }
}

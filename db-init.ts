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

    console.log(`🚀 Executing ${statements.length} SQL statements...`);
    
    let count = 0;
    let successCount = 0;
    let skippedCount = 0;
    
    for (const statement of statements) {
      count++;
      try {
        if (statement.length === 0) continue;
        
        process.stdout.write(`\r⏳ Executing statement ${count}/${statements.length}...`);
        await client.query(statement);
        successCount++;
        
        if (count % 20 === 0) {
          console.log(`\n  ✓ ${count}/${statements.length} processed (${successCount} successful)`);
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
          console.warn(`\n  ⚠️  Statement ${count} error: ${errMsg.substring(0, 80)}`);
        }
      }
    }

    console.log(`\n\n✅ Database initialization complete!`);
    console.log(`📊 Statements: ${successCount} executed, ${skippedCount} skipped (already exist)`);
    
  } catch (err: any) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    await client.end();
  }
}


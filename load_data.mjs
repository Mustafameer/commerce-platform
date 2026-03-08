import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionConfig = {
  host: 'postgres.railway.internal',
  port: 5432,
  user: 'postgres',
  password: 'yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ',
  database: 'railway',
};

async function loadData() {
  console.log('🚀 [LOAD-DATA] Starting database restore...');
  console.log('🔌 Connecting to:', connectionConfig.host);
  
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if data exists
    const result = await client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\'public\'');
    const tableCount = parseInt(result.rows[0].count);
    console.log('📊 Existing tables:', tableCount);
    
    if (tableCount > 0) {
      const storeCheck = await client.query('SELECT COUNT(*) FROM stores').catch(() => ({ rows: [{ count: 0 }] }));
      const storeCount = parseInt(storeCheck.rows[0].count);
      console.log('🏪 Existing stores:', storeCount);
      
      if (storeCount > 0) {
        console.log('✅ Database already has data, skipping restore');
        return;
      }
    }
    
    // Load backup
    console.log('📂 Reading backup file...');
    const backupPath = path.join(__dirname, 'database_backup.sql');
    
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Backup file not found:', backupPath);
      return;
    }
    
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    console.log('📊 Backup size:', (backupContent.length / 1024).toFixed(2), 'KB');
    
    // Execute backup
    console.log('🔄 Executing backup...');
    await client.query(backupContent);
    console.log('✅ Database restore complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

loadData();

import fs from 'fs';

async function restoreDatabaseViAPI() {
  try {
    console.log('📥 Reading SQL backup file...\n');
    
    if (!fs.existsSync('local_database_backup.sql')) {
      console.error('❌ Error: local_database_backup.sql not found');
      console.log('\nPlease run: node backup_to_sql_file.mjs');
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync('local_database_backup.sql', 'utf-8');
    console.log(`✅ Loaded SQL file: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB\n`);
    
    console.log('📤 Sending restore request to Railway...\n');
    
    const response = await fetch('https://web-production-9efff.up.railway.app/api/admin/restore-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authToken: 'admin-restore-key-2024',
        sql: sqlContent
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Restore failed:', result.error);
      process.exit(1);
    }
    
    console.log('✅ Restore completed successfully!');
    console.log(`📊 Statements executed: ${result.executed}`);
    if (result.errors && result.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`   - ${err.substring(0, 100)}`));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

restoreDatabaseViAPI();

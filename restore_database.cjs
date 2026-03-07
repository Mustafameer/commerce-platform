const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const railwayUrl = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';
const backupFile = path.join(__dirname, 'database_backup.sql');

async function restoreDatabase() {
  const client = new Client({
    connectionString: railwayUrl,
  });

  try {
    // قراءة ملف الـ backup
    console.log('📂 جاري قراءة ملف الـ backup...');
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    const statements = backupContent.split(';').filter(s => s.trim().length > 0);
    
    console.log(`📊 عدد الـ statements: ${statements.length}`);
    
    // الاتصال بـ Railway
    console.log('\n🔗 جاري الاتصال بـ Railway...');
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!\n');

    let executedCount = 0;
    let errorCount = 0;

    // تشغيل كل statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      try {
        if (statement.startsWith('--')) continue; // تخطي التعليقات
        
        process.stdout.write(`\r⏳ معالجة ${i + 1}/${statements.length}...`);
        await client.query(statement);
        executedCount++;
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.log(`\n⚠️  خطأ في statement ${i}: ${err.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n\n✅ تم استيراد البيانات بنجاح!`);
    console.log(`📈 Statements منفذة: ${executedCount}`);
    if (errorCount > 0) console.log(`⚠️  أخطاء: ${errorCount}`);

  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await client.end();
  }
}

restoreDatabase();

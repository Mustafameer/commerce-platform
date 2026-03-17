import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n📤 تصدير قاعدة البيانات المحلية...\n');

try {
  // تصدير قاعدة البيانات
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `commerce_platform_backup_${timestamp}.sql`;
  const filepath = path.join(process.cwd(), filename);

  console.log(`💾 تصدير إلى: ${filename}\n`);

  // استخدام pg_dump
  const command = `pg_dump -U postgres -h localhost -d multi_ecommerce -F p > "${filepath}"`;
  
  // استخدام PowerShell في Windows
  const psCommand = `$env:PGPASSWORD='123'; & 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe' -U postgres -h localhost -d multi_ecommerce -F p -f '${filepath}'`;
  
  try {
    execSync(psCommand, { shell: 'powershell.exe', stdio: 'inherit' });
    
    const fileSize = fs.statSync(filepath).size;
    console.log(`\n✅ تم التصدير بنجاح!`);
    console.log(`   📁 المسار: ${filepath}`);
    console.log(`   📊 الحجم: ${(fileSize / 1024).toFixed(2)} KB\n`);
    
    console.log('📋 الخطوات التالية:');
    console.log('1. افتح Railway dashboard');
    console.log('2. اذهب إلى PostgreSQL > Data > Backups');
    console.log('3. اختر "Restore" وحمل الملف');
    console.log(`4. أو استخدم CLI: railway db:restore ${filename}\n`);
    
  } catch (error) {
    console.log('\n❌ إذا لم ينجح التصدير التلقائي:');
    console.log('\nجرب اليدوي:');
    console.log('1. افتح PowerShell');
    console.log('2. اكتب:');
    console.log(`   $env:PGPASSWORD='123'; & 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe' -U postgres -h localhost -d multi_ecommerce > ${filename}\n`);
  }

} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.log('\nجرب الطريقة اليدوية:');
  console.log('1. افتح PowerShell');
  console.log('2. انتقل إلى مجلد المشروع');
  console.log('3. اكتب:');
  console.log('   $env:PGPASSWORD=\'123\'; & \'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe\' -U postgres -h localhost -d multi_ecommerce > backup.sql\n');
}

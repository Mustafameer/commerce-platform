#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function exportAndUpload() {
  try {
    console.log('\n🚀 بدء التصدير والرفع...\n');

    // 1. تصدير قاعدة البيانات المحلية
    console.log('📤 1. تصدير قاعدة البيانات المحلية...');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = `commerce_backup_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), backupFile);

    // استخدام pg_dump
    const dumpCmd = `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe" -U postgres -h localhost -d multi_ecommerce -F p > "${backupPath}"`;
    
    try {
      process.env.PGPASSWORD = '123';
      const { stdout, stderr } = await execAsync(dumpCmd, { shell: 'cmd.exe', maxBuffer: 50 * 1024 * 1024 });
      
      if (fs.existsSync(backupPath)) {
        const size = fs.statSync(backupPath).size;
        console.log(`   ✅ تم التصدير إلى: ${backupFile}`);
        console.log(`   📊 حجم الملف: ${(size / 1024 / 1024).toFixed(2)} MB\n`);

        console.log('📋 المحتوى:');
        console.log(`   - Path: ${backupPath}`);
        console.log(`   - Size: ${size} bytes`);
        console.log(`   - Type: PostgreSQL SQL Dump\n`);

        console.log('✅ ملف التصدير جاهز!\n');

        console.log('📤 الخطوات التالية لرفع إلى Railway:\n');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('الطريقة 1: استخدام Railway Dashboard');
        console.log('──────────────────────────────────────────────────');
        console.log('1. اذهب إلى: https://railway.app/');
        console.log('2. سجل دخول حسابك');
        console.log('3. اختر المشروع "commerce-platform"');
        console.log('4. انقر على خدمة PostgreSQL');
        console.log('5. اذهب إلى تبويب "Data"');
        console.log('6. انقر على "Restore from backup"');
        console.log(`7. احمل الملف: ${backupFile}`);
        console.log('8. اضغط "Confirm" وانتظر اكتمال العملية\n');

        console.log('الطريقة 2: استخدام Railway CLI');
        console.log('──────────────────────────────────────────────────');
        console.log('1. تثبيت Railway CLI:');
        console.log('   npm install -g @railway/cli\n');
        console.log('2. ربط المشروع:');
        console.log('   railway link\n');
        console.log('3. رفع قاعدة البيانات:');
        console.log(`   railway db:restore "${backupPath}"\n`);

        console.log('═══════════════════════════════════════════════════\n');

        console.log('⚠️  ملاحظاتمهمة:');
        console.log('   • سيث البيانات الحالية على Railway');
        console.log('   • استغرق العملية عدة دقائق');
        console.log('   • تأكد من النسخ الاحتياطي قبل الحذف\n');

        // Copy file info
        console.log(`✅ ملف النسخة الاحتياطية: ${backupFile}\n`);
        
      } else {
        console.log('❌ فشل التصدير');
        process.exit(1);
      }
    } catch (error) {
      console.log('⚠️  تعذر التصدير التلقائي\n');
      console.log('جرب yدويأ:');
      console.log('1. افتح PowerShell');
      console.log('2. اكتب:');
      console.log('   $env:PGPASSWORD=\'123\'');
      console.log('   & "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe" -U postgres -h localhost -d multi_ecommerce -F p > commerce_backup.sql\n');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

exportAndUpload();

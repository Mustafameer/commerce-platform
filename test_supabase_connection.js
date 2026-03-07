#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * استخدمه للتحقق من الاتصال بـ Supabase قبل النشر
 * 
 * الاستخدام:
 * npx ts-node test_supabase_connection.ts
 * أو
 * node test_supabase_connection.ts
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ خطأ: DATABASE_URL غير معرّف في .env');
  process.exit(1);
}

console.log('🔍 اختبار الاتصال بـ Supabase...\n');

const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
});

// اختبار 1: الاتصال الأساسي
async function testBasicConnection() {
  console.log('📡 اختبار 1: الاتصال الأساسي...');
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ نجح: الاتصال الأساسي يعمل');
    console.log(`   الوقت الحالي: ${result.rows[0].now}\n`);
    return true;
  } catch (error) {
    console.error('❌ فشل: الاتصال الأساسي');
    console.error(`   السبب: ${error.message}\n`);
    return false;
  }
}

// اختبار 2: وجود الجداول
async function testTableExistence() {
  console.log('📋 اختبار 2: وجود الجداول...');
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(r => r.table_name);
    const requiredTables = [
      'users', 'stores', 'products', 'orders', 'customers',
      'categories', 'app_settings', 'topup_companies',
      'topup_products', 'auctions'
    ];
    
    const missingTables = requiredTables.filter(t => !tables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ نجح: جميع الجداول موجودة');
      console.log(`   عدد الجداول: ${tables.length}`);
      console.log(`   الجداول: ${tables.join(', ')}\n`);
      return true;
    } else {
      console.error('⚠️  تحذير: بعض الجداول مفقودة');
      console.error(`   الجداول المفقودة: ${missingTables.join(', ')}`);
      console.error('   حل: شغّل SQL schema من supabase_schema.sql\n');
      return false;
    }
  } catch (error) {
    console.error('❌ فشل: اختبار الجداول');
    console.error(`   السبب: ${error.message}\n`);
    return false;
  }
}

// اختبار 3: عد الصفوف
async function testRowCounts() {
  console.log('📊 اختبار 3: عد الصفوف في الجداول...');
  try {
    const queries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT COUNT(*) as count FROM stores',
      'SELECT COUNT(*) as count FROM products',
      'SELECT COUNT(*) as count FROM orders',
      'SELECT COUNT(*) as count FROM customers',
    ];
    
    const tableNames = ['users', 'stores', 'products', 'orders', 'customers'];
    console.log('   إحصائيات البيانات:');
    
    for (let i = 0; i < queries.length; i++) {
      const result = await pool.query(queries[i]);
      const count = result.rows[0].count;
      console.log(`     ${tableNames[i].padEnd(12)}: ${count} صف`);
    }
    console.log();
    return true;
  } catch (error) {
    console.error('❌ فشل: عد الصفوف');
    console.error(`   السبب: ${error.message}\n`);
    return false;
  }
}

// اختبار 4: الأداء
async function testPerformance() {
  console.log('⚡ اختبار 4: اختبار الأداء...');
  try {
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await pool.query('SELECT 1');
    }
    
    const duration = Date.now() - startTime;
    const avgTime = (duration / 10).toFixed(2);
    
    console.log(`✅ نجح: 10 استعلامات في ${duration}ms`);
    console.log(`   متوسط الوقت: ${avgTime}ms\n`);
    return true;
  } catch (error) {
    console.error('❌ فشل: اختبار الأداء');
    console.error(`   السبب: ${error.message}\n`);
    return false;
  }
}

// اختبار 5: معلومات قاعدة البيانات
async function testDatabaseInfo() {
  console.log('ℹ️  اختبار 5: معلومات قاعدة البيانات...');
  try {
    // إصدار PostgreSQL
    let result = await pool.query('SELECT version()');
    const version = result.rows[0].version;
    console.log(`   إصدار PostgreSQL: ${version.substring(0, 50)}...`);
    
    // حجم قاعدة البيانات
    result = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size
    `);
    const size = result.rows[0].size;
    console.log(`   حجم قاعدة البيانات: ${size}`);
    
    // الاتصالات النشطة
    result = await pool.query(`
      SELECT COUNT(*) as active_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    const connections = result.rows[0].active_connections;
    console.log(`   الاتصالات النشطة: ${connections}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ فشل: معلومات قاعدة البيانات');
    console.error(`   السبب: ${error.message}\n`);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('═════════════════════════════════════');
  console.log('🧪 اختبار اتصال Supabase الشامل');
  console.log('═════════════════════════════════════\n');
  
  const results = [];
  
  try {
    results.push(await testBasicConnection());
    results.push(await testTableExistence());
    results.push(await testRowCounts());
    results.push(await testPerformance());
    results.push(await testDatabaseInfo());
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
  } finally {
    // إغلاق الاتصال
    await pool.end();
  }
  
  // الملخص النهائي
  console.log('═════════════════════════════════════');
  const passedCount = results.filter(r => r).length;
  console.log(`\n📈 النتيجة: ${passedCount}/${results.length} اختبارات نجحت\n`);
  
  if (passedCount === results.length) {
    console.log('🎉 ممتاز! جميع الاختبارات نجحت!');
    console.log('✅ الاتصال بـ Supabase يعمل بشكل صحيح');
    process.exit(0);
  } else {
    console.log('⚠️  بعض الاختبارات فشلت');
    console.log('🔧 يرجى تصحيح المشاكل وإعادة المحاولة');
    process.exit(1);
  }
}

// تشغيل
runAllTests().catch(error => {
  console.error('❌ خطأ حرج:', error);
  process.exit(1);
});

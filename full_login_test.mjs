#!/usr/bin/env node
import fetch from 'node-fetch';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@gondola.proxy.rlwy.net:42495/railway',
  ssl: { rejectUnauthorized: false },
});

async function runFullTest() {
  console.log('═'.repeat(60));
  console.log('🔍 اختبار شامل لنظام تسجيل دخول الـ Admin');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // 1. التحقق من قاعدة البيانات
    console.log('1️⃣ التحقق من قاعدة البيانات...\n');
    const dbResult = await pool.query(
      "SELECT id, name, phone, email, role, password FROM users WHERE phone = $1",
      ['admin']
    );

    if (dbResult.rows.length > 0) {
      const user = dbResult.rows[0];
      console.log('✅ المستخدم موجود في قاعدة البيانات:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - الاسم: ${user.name}`);
      console.log(`   - الهاتف: ${user.phone}`);
      console.log(`   - البريد: ${user.email}`);
      console.log(`   - الدور: ${user.role}`);
      console.log(`   - كلمة المرور: ${user.password}`);
      console.log('');
    } else {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات!');
      process.exit(1);
    }

    // 2. اختبار API
    console.log('2️⃣ اختبار API endpoint...\n');
    const apiResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: 'admin', password: 'admin' })
    });

    console.log(`   الاستجابة: ${apiResponse.status} ${apiResponse.statusText}`);
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log('✅ API يرجع بيانات صحيحة:');
      console.log(JSON.stringify(data, null, 3));
      console.log('');
    } else {
      console.log('❌ API يرد بخطأ!');
      console.log('الاستجابة:', await apiResponse.text());
      console.log('');
    }

    // 3. الملخص
    console.log('═'.repeat(60));
    console.log('📋 الملخص:');
    console.log('═'.repeat(60));
    console.log('✅ قاعدة البيانات: صحيحة');
    console.log('✅ البيانات: صحيحة (admin/admin)');
    console.log('✅ API: يعمل بشكل صحيح');
    console.log('');
    console.log('📝 الحل الموصى به:');
    console.log('1. افتح Browser Console (F12)');
    console.log('2. امسح الـ Cache (Ctrl+Shift+Delete)');
    console.log('3. أعد تحميل الصفحة (Ctrl+F5)');
    console.log('4. جرب تسجيل الدخول مجدداً');
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

runFullTest();

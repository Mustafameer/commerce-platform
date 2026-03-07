#!/usr/bin/env node

const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function testLogin() {
  try {
    console.log('🧪 ===== اختبار الدخول =====\n');

    // Test merchants
    const merchants = [
      { name: 'علي الهادي (متجر شحن)', phone: '07810909577', password: '123456' },
      { name: 'محمد علي (متجر عادي)', phone: '07810909578', password: '150165' },
      { name: 'مصطفى (البيت الانيق)', phone: '07810909579', password: '123456' }
    ];

    for (const merchant of merchants) {
      console.log(`\n📱 اختبار: ${merchant.name}`);
      console.log(`   الهاتف: ${merchant.phone}, كلمة المرور: ${merchant.password}`);
      
      // Check if exists in users
      const checkResult = await pool.query(
        'SELECT id, name, phone, password, role, store_id FROM users WHERE phone = $1',
        [merchant.phone]
      );

      if (checkResult.rows.length > 0) {
        const user = checkResult.rows[0];
        console.log(`   ✅ موجود في جدول users:`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - الاسم: ${user.name}`);
        console.log(`      - الهاتف المخزن: ${user.phone}`);
        console.log(`      - كلمة المرور المخزنة: ${user.password}`);
        console.log(`      - المدخلة: ${merchant.password}`);
        console.log(`      - تطابق؟ ${user.password === merchant.password ? '✅ نعم' : '❌ لا'}`);
        console.log(`      - المتجر ID: ${user.store_id}`);
        console.log(`      - الدور: ${user.role}`);

        // Get store info
        if (user.store_id) {
          const storeResult = await pool.query(
            'SELECT id, store_name, store_type, is_active FROM stores WHERE id = $1',
            [user.store_id]
          );
          if (storeResult.rows.length > 0) {
            const store = storeResult.rows[0];
            console.log(`      - المتجر: ${store.store_name} (${store.store_type})`);
          }
        }
      } else {
        console.log(`   ❌ غير موجود في جدول users`);
      }
    }

    // Check if there's any special table for merchants
    console.log('\n📊 جميع الجداول:');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tables.rows.forEach(t => {
      console.log(`   - ${t.table_name}`);
    });

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

testLogin();

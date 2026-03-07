const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixBaytAneeqStore() {
  try {
    console.log('🔧 ===== تصحيح بيانات متجر البيت الانيق =====\n');

    // 1. احصل على بيانات مصطفى
    const mustafaResult = await pool.query(
      'SELECT id, name, phone, password FROM users WHERE name ILIKE $1 AND role = $2',
      ['%مصطفى%', 'merchant']
    );

    if (mustafaResult.rows.length === 0) {
      console.log('❌ لم يتم العثور على مستخدم باسم مصطفى');
      process.exit(1);
    }

    const mustafa = mustafaResult.rows[0];
    console.log('📝 بيانات مصطفى الموجودة:');
    console.log(`   - ID: ${mustafa.id}`);
    console.log(`   - الاسم: ${mustafa.name}`);
    console.log(`   - الهاتف: ${mustafa.phone}`);
    console.log(`   - كلمة المرور: ${mustafa.password}`);

    // 2. احصل على متجر البيت الانيق
    const storeResult = await pool.query(
      'SELECT id, store_name, owner_id, owner_phone FROM stores WHERE store_name ILIKE $1',
      ['%البيت%']
    );

    if (storeResult.rows.length === 0) {
      console.log('❌ لم يتم العثور على متجر البيت الانيق');
      process.exit(1);
    }

    const store = storeResult.rows[0];
    console.log(`\n🏪 بيانات المتجر الحالية:`);
    console.log(`   - ID: ${store.id}`);
    console.log(`   - الاسم: ${store.store_name}`);
    console.log(`   - owner_id: ${store.owner_id}`);
    console.log(`   - owner_phone: ${store.owner_phone}`);

    // 3. تصحيح البيانات
    console.log(`\n🔄 جاري تصحيح البيانات...\n`);

    // تحديث جدول stores
    await pool.query(
      'UPDATE stores SET owner_id = $1, owner_phone = $2 WHERE id = $3',
      [mustafa.id, mustafa.phone, store.id]
    );
    console.log(`✅ تم تحديث المتجر (ID: ${store.id})`);
    console.log(`   - owner_id: ${store.owner_id} → ${mustafa.id}`);
    console.log(`   - owner_phone: ${store.owner_phone} → ${mustafa.phone}`);

    // تحديث جدول users
    await pool.query(
      'UPDATE users SET store_id = $1 WHERE id = $2',
      [store.id, mustafa.id]
    );
    console.log(`\n✅ تم تحديث المستخدم (ID: ${mustafa.id})`);
    console.log(`   - store_id: null → ${store.id}`);

    // 4. التحقق من النتيجة
    console.log(`\n✅ ===== التحقق من التصحيح =====\n`);

    const verifyStore = await pool.query(
      'SELECT id, store_name, owner_id, owner_name, owner_phone FROM stores WHERE id = $1',
      [store.id]
    );
    console.log('📋 بيانات المتجر بعد التصحيح:');
    console.log(verifyStore.rows[0]);

    const verifyUser = await pool.query(
      'SELECT id, name, phone, password, store_id FROM users WHERE id = $1',
      [mustafa.id]
    );
    console.log('\n👤 بيانات المستخدم بعد التصحيح:');
    console.log(verifyUser.rows[0]);

    // 5. اختبر الدخول
    console.log(`\n\n🧪 ===== اختبار الدخول =====\n`);
    console.log(`📱 الهاتف: ${mustafa.phone}`);
    console.log(`🔐 كلمة المرور: ${mustafa.password}`);
    console.log(`\n✅ يمكنك الآن الدخول بهذه البيانات!`);

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

fixBaytAneeqStore();

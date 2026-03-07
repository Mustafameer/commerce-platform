const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function debugLoginIssue() {
  try {
    console.log('🔍 ===== تحليل مشكلة الدخول =====\n');

    // 1. جميع المتاجر
    console.log('📍 جميع المتاجر الموجودة:');
    const stores = await pool.query(
      'SELECT id, store_name, owner_id, owner_phone, owner_name, is_active, status, store_type FROM stores ORDER BY id'
    );
    stores.rows.forEach(s => {
      console.log(`   ID: ${s.id}, الاسم: ${s.store_name}, صاحب المتجر: ${s.owner_name}`);
      console.log(`      - هاتف صاحب المتجر: ${s.owner_phone}`);
      console.log(`      - owner_id: ${s.owner_id}`);
      console.log(`      - نشط: ${s.is_active}, الحالة: ${s.status}`);
    });

    // 2. جميع المستخدمين (التجار)
    console.log('\n👥 جميع المستخدمين:');
    const users = await pool.query(
      'SELECT id, name, phone, password, role, store_id, email FROM users ORDER BY id'
    );
    users.rows.forEach(u => {
      console.log(`   ID: ${u.id}, الاسم: ${u.name}, الهاتف: ${u.phone}, الدور: ${u.role}`);
      console.log(`      - كلمة المرور: ${u.password}`);
      console.log(`      - store_id: ${u.store_id}`);
      console.log(`      - البريد: ${u.email || 'لم يتم تحديده'}`);
    });

    // 3. البحث عن البيت الانيق
    console.log('\n🏪 البحث عن متجر "البيت الانيق":');
    const baytAneeq = await pool.query(
      'SELECT * FROM stores WHERE store_name ILIKE $1',
      ['%البيت%']
    );

    if (baytAneeq.rows.length === 0) {
      console.log('❌ لم يتم العثور على متجر البيت الانيق');
    } else {
      baytAneeq.rows.forEach(store => {
        console.log(`   ✅ وجدت: ${store.store_name}`);
        console.log(`      - ID: ${store.id}`);
        console.log(`      - owner_id: ${store.owner_id}`);
        console.log(`      - owner_name: ${store.owner_name}`);
        console.log(`      - owner_phone: ${store.owner_phone}`);
        console.log(`      - is_active: ${store.is_active}`);
        console.log(`      - status: ${store.status}`);

        // تحقق من وجود المستخدم المرتبط
        if (store.owner_id) {
          const user = users.rows.find(u => u.id === store.owner_id);
          if (user) {
            console.log(`\n   📝 المستخدم المرتبط:`);
            console.log(`      - الاسم: ${user.name}`);
            console.log(`      - الهاتف: ${user.phone}`);
            console.log(`      - كلمة المرور: ${user.password}`);
            console.log(`      - الدور: ${user.role}`);
            console.log(`\n   ✅ SOLUTION - تسجيل الدخول:`);
            console.log(`      📱 الهاتف: ${user.phone}`);
            console.log(`      🔐 كلمة المرور: ${user.password}`);
          } else {
            console.log(`   ❌ المستخدم (ID: ${store.owner_id}) غير موجود في جدول users!`);
          }
        } else {
          console.log(`   ❌ المتجر لا يملك owner_id`);
        }
      });
    }

    // 4. اختبر الدخول
    console.log('\n\n🧪 اختبار الدخول للمتجر:');
    if (baytAneeq.rows.length > 0 && baytAneeq.rows[0].owner_phone) {
      const testPhone = baytAneeq.rows[0].owner_phone;
      const testResult = await pool.query(
        'SELECT * FROM users WHERE phone = $1',
        [testPhone]
      );
      if (testResult.rows.length > 0) {
        const user = testResult.rows[0];
        console.log(`   ✅ المستخدم موجود:`);
        console.log(`      - الاسم: ${user.name}`);
        console.log(`      - الهاتف: ${user.phone}`);
        console.log(`      - كلمة المرور: ${user.password}`);
        console.log(`      - الدور: ${user.role}`);
      } else {
        console.log(`   ❌ المستخدم برقم الهاتف ${testPhone} غير موجود`);
      }
    }

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

debugLoginIssue();

const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function debugLogin() {
  try {
    console.log('🔍 ===== تحليل بيانات الدخول =====\n');

    // البحث عن الرقم 07810909577
    const userResult = await pool.query(
      'SELECT id, name, phone, password, role, store_id FROM users WHERE phone = $1',
      ['07810909577']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ المستخدم برقم 07810909577 غير موجود!\n');
    } else {
      const user = userResult.rows[0];
      console.log('✅ وجدت المستخدم:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - الاسم: ${user.name}`);
      console.log(`   - الهاتف: ${user.phone}`);
      console.log(`   - كلمة المرور: ${user.password}`);
      console.log(`   - الدور: ${user.role}`);
      console.log(`   - المتجر ID: ${user.store_id}`);

      // تحقق من المتجر المرتبط
      if (user.store_id) {
        const storeResult = await pool.query(
          'SELECT id, store_name FROM stores WHERE id = $1',
          [user.store_id]
        );
        if (storeResult.rows.length > 0) {
          console.log(`   - المتجر: ${storeResult.rows[0].store_name}`);
        }
      }
    }

    // اعرض جميع المستخدمين
    console.log('\n📋 جميع المستخدمين:');
    const allUsers = await pool.query(
      'SELECT id, name, phone, password, role FROM users ORDER BY id'
    );
    allUsers.rows.forEach(u => {
      console.log(`   ID: ${u.id}, الاسم: ${u.name}, الهاتف: ${u.phone}, كلمة المرور: ${u.password}, الدور: ${u.role}`);
    });

    // اعرض جميع المتاجر
    console.log('\n📋 جميع المتاجر:');
    const stores = await pool.query(
      'SELECT id, store_name, owner_id, owner_phone, owner_name FROM stores ORDER BY id'
    );
    stores.rows.forEach(s => {
      console.log(`   ID: ${s.id}, المتجر: ${s.store_name}, المالك: ${s.owner_name}, الهاتف: ${s.owner_phone}, owner_id: ${s.owner_id}`);
    });

    console.log('\n\n💡 التوصيات:');
    console.log('إذا كنت تريد الدخول برقم 07810909577:');
    const adminUser = allUsers.rows.find(u => u.phone === '07810909577');
    if (adminUser) {
      console.log(`✅ استخدم: الهاتف = 07810909577, كلمة المرور = ${adminUser.password}`);
    } else {
      console.log('❌ هذا الرقم غير مسجل');
    }

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

debugLogin();

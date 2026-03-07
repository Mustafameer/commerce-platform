const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function updatePassword() {
  try {
    console.log('🔄 ===== تحديث كلمة المرور =====\n');

    // احصل على بيانات مصطفى الحالية
    const currentUser = await pool.query(
      'SELECT id, name, phone, password FROM users WHERE id = 19'
    );

    if (currentUser.rows.length === 0) {
      console.log('❌ لم يتم العثور على المستخدم');
      process.exit(1);
    }

    const user = currentUser.rows[0];
    console.log('👤 البيانات الحالية:');
    console.log(`   - الاسم: ${user.name}`);
    console.log(`   - الهاتف: ${user.phone}`);
    console.log(`   - كلمة المرور الحالية: ${user.password}`);

    // تحديث كلمة المرور
    console.log(`\n🔄 جاري تحديث كلمة المرور...`);
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = 19',
      ['150165']
    );

    console.log(`✅ تم تحديث كلمة المرور`);

    // التحقق من التحديث
    const updated = await pool.query(
      'SELECT id, name, phone, password FROM users WHERE id = 19'
    );

    const updatedUser = updated.rows[0];
    console.log(`\n✅ البيانات الجديدة:`);
    console.log(`   - الاسم: ${updatedUser.name}`);
    console.log(`   - الهاتف: ${updatedUser.phone}`);
    console.log(`   - كلمة المرور الجديدة: ${updatedUser.password}`);

    console.log(`\n\n✅ ===== بيانات الدخول الصحيحة =====\n`);
    console.log(`📱 الهاتف: ${updatedUser.phone}`);
    console.log(`🔐 كلمة المرور: ${updatedUser.password}`);
    console.log(`\n🎉 يمكنك الآن الدخول بهذه البيانات!`);

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

updatePassword();

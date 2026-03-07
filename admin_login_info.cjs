const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function getAdminInfo() {
  try {
    console.log('🔐 ===== بيانات دخول الآدمن =====\n');

    // Get admin user
    const adminResult = await pool.query(
      "SELECT id, name, phone, password, role, email FROM users WHERE role = 'admin'"
    );

    if (adminResult.rows.length > 0) {
      adminResult.rows.forEach(admin => {
        console.log('👤 بيانات الآدمن:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   📝 الاسم: ${admin.name}`);
        console.log(`   📱 الهاتف (اسم المستخدم): ${admin.phone}`);
        console.log(`   🔐 كلمة المرور: ${admin.password}`);
        console.log(`   👑 الدور: ${admin.role}`);
        console.log(`   📧 البريد الإلكتروني: ${admin.email || 'غير مسجل'}`);
      });
    } else {
      console.log('❌ لا يوجد مستخدم آدمن في قاعدة البيانات');
    }

    console.log('\n🌐 ===== طريقة الدخول =====\n');
    console.log('1️⃣ افتح الرابط:');
    console.log('   http://localhost:5173/login\n');
    console.log('2️⃣ أدخل البيانات:');
    console.log('   📱 الهاتف: admin');
    console.log('   🔐 كلمة المرور: password\n');
    console.log('3️⃣ اضغط "دخول"\n');
    console.log('4️⃣ ستنتقل تلقائياً إلى: http://localhost:5173/admin\n');

    console.log('📊 ===== ما يمكنك فعله كآدمن =====\n');
    console.log('✅ عرض وإدارة المتاجر');
    console.log('✅ عرض وإدارة المستخدمين');
    console.log('✅ عرض والطلبات');
    console.log('✅ عرض الإحصائيات');
    console.log('✅ إضافة متاجر جديدة');
    console.log('✅ إضافة مستخدمين جدد');

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

getAdminInfo();

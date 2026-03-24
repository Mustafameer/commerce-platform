import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

(async () => {
  try {
    // Create a test admin user
    const phone = '+966501234567';
    const password = 'admin123';
    const email = 'admin@example.com';
    
    const res = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, is_active, store_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, name, email, role, phone`,
      [
        'مسؤول النظام',  // name
        email,            // email
        phone,            // phone
        password,         // password (plain text as used in login)
        'admin',          // role
        true,             // is_active
        null              // store_id (null for admin)
      ]
    );

    if (res.rows.length > 0) {
      const user = res.rows[0];
      console.log('✅ تم إنشاء مستخدم admin بنجاح!');
      console.log('');
      console.log('📋 تفاصيل الدخول:');
      console.log('═══════════════════════════════════════');
      console.log(`� الهاتف: ${phone}`);
      console.log(`🔐 كلمة المرور: ${password}`);
      console.log(`📧 البريد الإلكتروني: ${email}`);
      console.log(`👤 الاسم: ${user.name}`);
      console.log(`🔑 الدور: ${user.role}`);
      console.log('═══════════════════════════════════════');
      console.log('');
      console.log('🌐 اذهب إلى: http://localhost:3000/login');
      console.log('استخدم الهاتف + كلمة المرور للدخول');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    console.error(err);
    process.exit(1);
  }
})();

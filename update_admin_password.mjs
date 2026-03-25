import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@gondola.proxy.rlwy.net:42495/railway',
  ssl: { rejectUnauthorized: false },
});

async function updateAdminPassword() {
  try {
    console.log('🔄 تحديث كلمة مرور الـ admin...');
    
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE phone = $2 RETURNING id, name, phone",
      ['admin', 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ تم تحديث كلمة المرور بنجاح!');
      console.log('👤 المستخدم:', result.rows[0]);
      console.log('🔐 بيانات الدخول:');
      console.log('   📞 رقم الهاتف: admin');
      console.log('   🔑 كلمة المرور: admin');
    } else {
      console.log('⚠️ لم يتم العثور على مستخدم admin');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

updateAdminPassword();

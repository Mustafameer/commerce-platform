import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce', ssl: false});

(async () => {
  try {
    console.log('🔧 تحديث مستخدم للعمل مع Store 13...\n');

    // Create a new user for Store 13 or update existing
    const updateResult = await pool.query(`
      INSERT INTO users (name, email, phone, password, role, store_id, is_active, can_access_admin)
      VALUES ('تاجر الشحن', 'topup.merchant@commerce.local', '0791111111', 'password', 'merchant', 13, true, false)
      ON CONFLICT (phone) DO UPDATE SET store_id = 13
      RETURNING id, name, phone, role, store_id
    `).catch(async () => {
      // If no unique constraint on phone, just update
      const res = await pool.query(`
        UPDATE users SET store_id = 13 WHERE phone = '0791111111'
        RETURNING id, name, phone, role, store_id
      `);
      if (res.rows.length === 0) {
        return await pool.query(`
          INSERT INTO users (name, email, phone, password, role, store_id, is_active, can_access_admin)
          VALUES ('تاجر الشحن', 'topup.merchant@commerce.local', '0791111111', 'password', 'merchant', 13, true, false)
          RETURNING id, name, phone, role, store_id
        `);
      }
      return res;
    });

    console.log('✅ مستخدم متحدث/منشأ:');
    const user = updateResult.rows[0];
    console.log(`   الاسم: ${user.name}`);
    console.log(`   الهاتف: ${user.phone}`);
    console.log(`   الدور: ${user.role}`);
    console.log(`   المتجر: ${user.store_id}`);

    console.log('\n✅ الآن يمكنك الدخول مع:');
    console.log(`   📱 الهاتف: ${user.phone}`);
    console.log(`   🔐 كلمة المرور: password`);
    
    console.log('\n🔗 الرابط: http://localhost:3000/topup-merchant');

    await pool.end();
  } catch(e) {
    console.log('❌ Error:', e.message);
    await pool.end();
  }
})();

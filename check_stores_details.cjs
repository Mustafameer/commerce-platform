const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkStoreStatus() {
  try {
    console.log('🔍 ===== فحص حالة المتاجر بالتفصيل =====\n');

    const stores = [13, 8, 3]; // علي الهادي، متجر النور، البيت الانيق

    for (const storeId of stores) {
      const result = await pool.query(
        'SELECT * FROM stores WHERE id = $1',
        [storeId]
      );

      if (result.rows.length > 0) {
        const store = result.rows[0];
        console.log(`\n🏪 المتجر: ${store.store_name} (ID: ${store.id})`);
        console.log(`   - نوع المتجر: ${store.store_type}`);
        console.log(`   - نشط: ${store.is_active}`);
        console.log(`   - الحالة: ${store.status}`);
        console.log(`   - المالك: ${store.owner_name}`);
        console.log(`   - هاتف المالك: ${store.owner_phone}`);
        console.log(`   - owner_id: ${store.owner_id}`);
        console.log(`   - created_at: ${store.created_at}`);
        console.log(`   - is_active: ${store.is_active} (النوع: ${typeof store.is_active})`);
        console.log(`   - status: ${store.status}`);

        // Check associated user
        const userResult = await pool.query(
          'SELECT id, name, phone, password, role, store_id FROM users WHERE id = $1',
          [store.owner_id]
        );
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          console.log(`   📝 المستخدم التجار:`);
          console.log(`      - ID: ${user.id}`);
          console.log(`      - الاسم: ${user.name}`);
          console.log(`      - الهاتف: ${user.phone}`);
          console.log(`      - كلمة المرور: ${user.password}`);
          console.log(`      - الدور: ${user.role}`);
          console.log(`      - store_id: ${user.store_id}`);
        }
      }
    }

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

checkStoreStatus();

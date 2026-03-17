import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkStores() {
  const client = await pool.connect();
  try {
    console.log('🔍 جاري التحقق من حالة المتاجر...\n');

    // Check all stores
    const allStores = await client.query('SELECT id, store_name, owner_id, owner_phone, is_active, status FROM stores ORDER BY id DESC');
    
    console.log('📊 جميع المتاجر في قاعدة البيانات:');
    console.log('════════════════════════════════════════════════');
    if (allStores.rows.length === 0) {
      console.log('   ❌ لا توجد متاجر');
    } else {
      for (const store of allStores.rows) {
        const status = store.is_active ? '✅' : '❌';
        const approval = store.status === 'approved' ? '✅' : '⚠️';
        console.log(`   ${status} المتجر ${store.id}: "${store.store_name}"`);
        console.log(`      • الصاحب: ${store.owner_phone} (ID: ${store.owner_id})`);
        console.log(`      • حالة التفعيل: ${store.is_active ? 'مفعل' : 'معطل'}`);
        console.log(`      • حالة الموافقة: ${approval} ${store.status}`);
        console.log('');
      }
    }

    // Check users
    console.log('\n📋 المستخدمين المرتبطين بالمتاجر:');
    console.log('════════════════════════════════════════════════');
    const users = await client.query('SELECT id, phone, role, is_active FROM users ORDER BY id DESC');
    for (const user of users.rows) {
      const active = user.is_active ? '✅' : '❌';
      console.log(`   ${active} المستخدم ${user.id}: ${user.phone} (${user.role})`);
    }

    // Check relationship
    console.log('\n🔗 العلاقة بين المستخدمين والمتاجر:');
    console.log('════════════════════════════════════════════════');
    const relationship = await client.query(`
      SELECT 
        s.id as store_id,
        s.store_name,
        s.owner_id,
        u.phone as owner_phone,
        u.role
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.id DESC
    `);
    
    for (const row of relationship.rows) {
      console.log(`   متجر ${row.store_id}: "${row.store_name}"`);
      console.log(`      → المالك: ${row.owner_phone || 'بدون'} (ID: ${row.owner_id || 'NULL'})`);
      if (row.role) {
        console.log(`      → الدور: ${row.role}`);
      }
    }

    console.log('\n✅ انتهى الفحص');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStores();

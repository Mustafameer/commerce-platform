import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function check() {
  try {
    console.log('📊 فحص جميع المتاجر:\n');
    
    const result = await pool.query(`
      SELECT id, store_name, is_active, status, owner_name, owner_phone, percentage_enabled, commission_percentage
      FROM stores
      ORDER BY id DESC
    `);
    
    console.log(`عدد المتاجر: ${result.rows.length}\n`);
    
    for (const store of result.rows) {
      const active = store.is_active ? '✅ مفعل' : '❌ معطل';
      console.log(`ID: ${store.id}`);
      console.log(`  اسم: ${store.store_name}`);
      console.log(`  الحالة: ${active} (${store.status})`);
      console.log(`  المالك: ${store.owner_name} (${store.owner_phone})`);
      console.log();
    }
  } catch (e) {
    console.error('خطأ:', e.message);
  } finally {
    await pool.end();
  }
}

check();

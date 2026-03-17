import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkStores() {
  try {
    console.log('🔍 فحص المتاجر الموجودة:\n');

    const storesResult = await pool.query(
      `SELECT id, slug, status, is_active FROM stores ORDER BY id`
    );
    
    console.log(`📊 عدد المتاجر: ${storesResult.rows.length}\n`);
    
    storesResult.rows.forEach(store => {
      console.log(`🏪 Store ID: ${store.id}`);
      console.log(`   Slug: ${store.slug}`);
      console.log(`   Status: ${store.status}`);
      console.log(`   Active: ${store.is_active}\n`);
    });

    // Check users linked to stores
    const usersResult = await pool.query(
      `SELECT id, name, phone, store_id, role FROM users WHERE store_id IS NOT NULL`
    );
    
    console.log(`\n👥 المستخدمين المرتبطين بمتاجر: ${usersResult.rows.length}`);
    usersResult.rows.forEach(user => {
      console.log(`   ID: ${user.id}, Name: ${user.name}, Store: ${user.store_id}, Role: ${user.role}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStores();

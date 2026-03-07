const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function analyzeAuthStructure() {
  try {
    console.log('🔍 ===== تحليل بنية المصادقة =====\n');

    // Get all tables in database
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 جميع الجداول الموجودة:');
    tables.rows.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.table_name}`);
    });

    // Check users table structure
    console.log('\n👥 بنية جدول users:');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    usersColumns.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? '✓' : 'nullable'}`);
    });

    // Check stores table structure
    console.log('\n🏪 بنية جدول stores:');
    const storesColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'stores'
      ORDER BY ordinal_position
    `);
    storesColumns.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    });

    // Check all users with their stores
    console.log('\n👤 جميع المستخدمين (التجار):');
    const users = await pool.query(`
      SELECT u.id, u.name, u.phone, u.password, u.role, u.store_id, s.store_name, s.store_type
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      ORDER BY u.id
    `);
    users.rows.forEach(u => {
      console.log(`  ID: ${u.id}, الاسم: ${u.name}, الهاتف: ${u.phone}, كلمة المرور: ${u.password}`);
      console.log(`    - الدور: ${u.role}, المتجر: ${u.store_name || 'لا يوجد'} (${u.store_type || '-'})`);
    });

    // Check for any related tables
    const relatedTables = tables.rows.filter(t => 
      t.table_name.includes('merchant') || 
      t.table_name.includes('user') ||
      t.table_name.includes('login') ||
      t.table_name.includes('auth')
    );
    
    if (relatedTables.length > 0) {
      console.log('\n🔗 جداول مرتبطة أخرى:');
      relatedTables.forEach(t => {
        console.log(`  - ${t.table_name}`);
      });
    }

    // Check stores data
    console.log('\n🏢 معلومات المتاجر:');
    const stores = await pool.query(`
      SELECT id, store_name, owner_phone, store_type, is_active, status
      FROM stores
      ORDER BY id
    `);
    stores.rows.forEach(s => {
      console.log(`  ID: ${s.id}, الاسم: ${s.store_name}, الهاتف: ${s.owner_phone}, النوع: ${s.store_type}, نشط: ${s.is_active}`);
    });

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

analyzeAuthStructure();

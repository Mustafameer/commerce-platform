import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce',
  user: 'postgres',
  password: '123',
});

async function showAllTables() {
  try {
    console.log('📊 عرض جميع جداول قاعدة البيانات\n');
    
    // الحصول على قائمة الجداول
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tableNames = tablesResult.rows.map(r => r.table_name);
    
    console.log(`✅ عدد الجداول: ${tableNames.length}\n`);
    console.log('📋 قائمة الجداول:');
    tableNames.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // عرض تفاصيل كل جدول
    for (const tableName of tableNames) {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const countResult = await pool.query(countQuery);
      const rowCount = countResult.rows[0].count;
      
      console.log(`\n📁 جدول: ${tableName} (${rowCount} سجل)`);
      console.log('─'.repeat(50));
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
        console.log(`  • ${col.column_name.padEnd(20)} : ${col.data_type.padEnd(15)} [NULL: ${nullable}]`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // إحصائيات عامة
    console.log('📊 الإحصائيات:');
    const statsQueries = {
      'المستخدمين': 'SELECT COUNT(*) as count FROM users;',
      'المتاجر': 'SELECT COUNT(*) as count FROM stores;',
      'المنتجات': 'SELECT COUNT(*) as count FROM products;',
      'الطلبات': 'SELECT COUNT(*) as count FROM orders;',
      'العملاء': 'SELECT COUNT(*) as count FROM customers;',
      'الأصناف': 'SELECT COUNT(*) as count FROM categories;'
    };
    
    for (const [name, query] of Object.entries(statsQueries)) {
      try {
        const result = await pool.query(query);
        console.log(`  ✅ ${name}: ${result.rows[0].count}`);
      } catch (err) {
        // الجدول قد لا يكون موجود
      }
    }
    
    console.log('\n✅ اكتمل العرض');
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

showAllTables();

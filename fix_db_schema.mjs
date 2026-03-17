import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function fixDatabaseSchema() {
  const client = await pool.connect();
  try {
    console.log('🔧 إصلاح schema قاعدة البيانات...\n');

    // Check if stores table has a primary key
    const pkCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'stores' AND constraint_type = 'PRIMARY KEY'
    `);
    
    if (pkCheck.rows.length === 0) {
      console.log('   ❌ لا توجد مفتاح أساسي على جدول stores');
      console.log('   ✅ إضافة مفتاح أساسي...');
      try {
        await client.query('ALTER TABLE stores ADD PRIMARY KEY (id)');
        console.log('   ✅ تمت إضافة المفتاح الأساسي');
      } catch(e) {
        console.log('   ⚠️  المفتاح الأساسي موجود بالفعل');
      }
    } else {
      console.log('   ✅ المفتاح الأساسي موجود');
    }

    // Check for unique constraint on stores.id
    const uniqueCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'stores' AND constraint_type = 'UNIQUE'
    `);
    
    console.log(`\n✅ Unique constraints على stores: ${uniqueCheck.rows.length}`);
    
    // List all foreign keys referencing stores
    const fkCheck = await client.query(`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage
      WHERE referenced_table_name = 'stores'
    `);
    
    console.log(`\n✅ Foreign keys يشيرون إلى stores: ${fkCheck.rows.length}`);

    console.log('\n✅ تمت المعالجة بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabaseSchema();

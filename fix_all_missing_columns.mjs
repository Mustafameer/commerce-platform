import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function addAllMissingColumns() {
  try {
    console.log('\n📝 إضافة الأعمدة الناقصة...\n');

    const columns = [
      { table: 'users', column: 'role', type: "VARCHAR(50) DEFAULT 'user'" },
      { table: 'users', column: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { table: 'users', column: 'avatar', type: 'VARCHAR(500)' },
      { table: 'categories', column: 'image_url', type: 'VARCHAR(500)' },
    ];

    for (const col of columns) {
      try {
        await pool.query(`
          ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type};
        `);
        console.log(`✅ ${col.table}.${col.column}`);
      } catch (err) {
        if (err.code !== '42701') {
          console.log(`⚠️  ${col.table}.${col.column}: ${err.message}`);
        } else {
          console.log(`✅ ${col.table}.${col.column} (موجود بالفعل)`);
        }
      }
    }

    console.log('\n✅ اكتمل بنجاح!\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

addAllMissingColumns();

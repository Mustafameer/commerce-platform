import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function addMissingColumns() {
  try {
    // Add role column
    await pool.query(`
      ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    `).catch(err => {
      if (err.code !== '42701') throw err; // 42701 = column exists
    });
    
    console.log('✅ تم إضافة/تحديث العمود role');
    
    // Add image_url to categories
    await pool.query(`
      ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
    `).catch(err => {
      if (err.code !== '42701') throw err;
    });
    
    console.log('✅ تم إضافة/تحديث العمود image_url');
    
    console.log('\n✅ تم إصلاح جميع الأعمدة الناقصة!\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingColumns();

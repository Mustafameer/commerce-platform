import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce",
  connectionTimeoutMillis: 5000,
});

async function addGalleryColumn() {
  try {
    console.log("🔄 جاري إضافة عمود gallery...");
    
    const result = await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
    `);
    
    console.log("✅ تم إضافة عمود gallery بنجاح!");
    
    // التحقق من العمود
    const checkColumn = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'gallery';
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log("✅ تم التحقق: العمود gallery موجود الآن");
      console.log(`   النوع: ${checkColumn.rows[0].data_type}`);
    }
    
    // عرض جميع أعمدة الجدول
    const allColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log("\n📊 أعمدة جدول products:");
    allColumns.rows.forEach(col => {
      console.log(`   ✓ ${col.column_name}: ${col.data_type}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addGalleryColumn();

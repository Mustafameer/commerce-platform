import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

const testProductImages = async () => {
  try {
    console.log('🧪 اختبار نظام الصور للمنتجات\n');

    // 1. فحص هيكل الجدول
    console.log('📊 فحص هيكل جدول product_images:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position;
    `);

    console.log('─'.repeat(80));
    tableInfo.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` = ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(25)} | ${nullable}${defaultVal}`);
    });
    console.log('─'.repeat(80));
    console.log('');

    // 2. فحص Indexes
    console.log('🔍 الـ Indexes المتاحة:');
    const indexes = await pool.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'product_images';
    `);

    indexes.rows.forEach(idx => {
      console.log(`  ✓ ${idx.indexname}`);
    });
    console.log('');

    // 3. فحص عدد الصور الموجودة
    console.log('📸 الإحصائيات الحالية:');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_images,
        COUNT(DISTINCT product_id) as products_with_images
      FROM product_images;
    `);

    const stat = stats.rows[0];
    console.log(`  • عدد الصور الإجمالي: ${stat.total_images}`);
    console.log(`  • عدد المنتجات التي لديها صور: ${stat.products_with_images}`);
    console.log('');

    // 4. عرض بيانات الجدول (إن وجدت)
    console.log('📋 عينة من البيانات:');
    const sampleData = await pool.query(`
      SELECT * FROM product_images 
      ORDER BY uploaded_at DESC NULLS LAST
      LIMIT 5;
    `);

    if (sampleData.rows.length === 0) {
      console.log('  → لا توجد صور بعد');
    } else {
      sampleData.rows.forEach((img, idx) => {
        console.log(`  ${idx + 1}. ID: ${img.id}`);
        console.log(`     Product ID: ${img.product_id}`);
        console.log(`     URL: ${img.image_url}`);
        if (img.image_type) console.log(`     Type: ${img.image_type}`);
        if (img.file_size) console.log(`     Size: ${(img.file_size / 1024).toFixed(2)} KB`);
        console.log('');
      });
    }

    console.log('✅ اكتمل الفحص بنجاح!');
    console.log('');
    console.log('📚 الـ Queries المتاحة للاستخدام:');
    console.log(`
    -- الحصول على جميع صور منتج معين
    SELECT * FROM product_images 
    WHERE product_id = ? 
    ORDER BY id ASC;

    -- إضافة صورة جديدة
    INSERT INTO product_images 
    (product_id, store_id, image_url, image_type, file_size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?);

    -- حذف صورة
    DELETE FROM product_images WHERE id = ?;

    -- تحديث معلومات الصورة
    UPDATE product_images SET image_type = ?, file_size = ? WHERE id = ?;

    -- الحصول على إحصائيات الصور لمتجر
    SELECT 
      product_id,
      COUNT(*) as image_count,
      SUM(file_size) as total_size
    FROM product_images 
    WHERE store_id = ?
    GROUP BY product_id;
    `);

  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
  } finally {
    await pool.end();
  }
};

testProductImages();

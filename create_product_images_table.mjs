import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

const createProductImagesTable = async () => {
  try {
    console.log('📸 Creating product_images table...\n');

    // Create product_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        image_url VARCHAR(1024) NOT NULL,
        image_name VARCHAR(255),
        image_size INTEGER,
        image_type VARCHAR(50),
        position INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ جدول product_images تم إنشاؤه بنجاح');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
      ON product_images(product_id);
    `);
    console.log('✓ Index على product_id تم إنشاؤه');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_store_id 
      ON product_images(store_id);
    `);
    console.log('✓ Index على store_id تم إنشاؤه');

    // Create function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_product_images_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Function لتحديث timestamp تم إنشاؤها');

    // Create trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_product_images_timestamp_trigger 
      ON product_images;
    `);

    await pool.query(`
      CREATE TRIGGER update_product_images_timestamp_trigger
      BEFORE UPDATE ON product_images
      FOR EACH ROW
      EXECUTE FUNCTION update_product_images_timestamp();
    `);
    console.log('✓ Trigger لتحديث الوقت تم إنشاؤه');

    console.log('\n✅ جميع جداول الصور تم إنشاؤها بنجاح!\n');

    // Show table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position;
    `);

    console.log('📋 هيكل الجدول:');
    console.log('─'.repeat(70));
    tableInfo.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` (${col.column_default})` : '';
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${nullable}${defaultVal}`);
    });
    console.log('─'.repeat(70));

    await pool.end();
    console.log('\n✓ تم!');

  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
    console.error('Full error:', error);
    await pool.end();
  }
};

createProductImagesTable();

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function updateImageTable() {
  try {
    console.log('🔄 Checking topup_product_images table schema...\n');
    
    // Check existing columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_product_images'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Current columns:');
    const existingColumns = new Set(columnsResult.rows.map(r => r.column_name));
    columnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });
    
    // Check which columns need to be added
    const requiredColumns = {
      topup_product_id: 'INTEGER',
      image_url: 'TEXT',
      image_url_original: 'TEXT',
      image_hash: 'VARCHAR(32)',
      image_type: 'VARCHAR(50)',
      uploaded_at: 'TIMESTAMP',
      store_id: 'INTEGER',
      product_id: 'INTEGER',
      image_data: 'TEXT'
    };
    
    console.log('\n🔍 Adding missing columns...\n');
    
    // Add topup_product_id if missing
    if (!existingColumns.has('topup_product_id')) {
      console.log('➕ Adding topup_product_id...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ADD COLUMN topup_product_id INTEGER REFERENCES topup_products(id) ON DELETE CASCADE
        `);
        console.log('✅ topup_product_id added\n');
      } catch (e) {
        console.log('⚠️  topup_product_id: ' + e.message + '\n');
      }
    }
    
    // Add image_url if missing
    if (!existingColumns.has('image_url')) {
      console.log('➕ Adding image_url...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ADD COLUMN image_url TEXT
        `);
        console.log('✅ image_url added\n');
      } catch (e) {
        console.log('⚠️  image_url: ' + e.message + '\n');
      }
    }
    
    // Add image_url_original if missing
    if (!existingColumns.has('image_url_original')) {
      console.log('➕ Adding image_url_original...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ADD COLUMN image_url_original TEXT
        `);
        console.log('✅ image_url_original added\n');
      } catch (e) {
        console.log('⚠️  image_url_original: ' + e.message + '\n');
      }
    }
    
    // Add image_hash if missing
    if (!existingColumns.has('image_hash')) {
      console.log('➕ Adding image_hash...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ADD COLUMN image_hash VARCHAR(32)
        `);
        console.log('✅ image_hash added\n');
      } catch (e) {
        console.log('⚠️  image_hash: ' + e.message + '\n');
      }
    }
    
    // Add uploaded_at if missing (image_type might already exist)
    if (!existingColumns.has('uploaded_at')) {
      console.log('➕ Adding uploaded_at...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ADD COLUMN uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ uploaded_at added\n');
      } catch (e) {
        console.log('⚠️  uploaded_at: ' + e.message + '\n');
      }
    }
    
    // Check if image_type has proper default
    if (existingColumns.has('image_type')) {
      console.log('📝 Updating image_type default value...');
      try {
        await pool.query(`
          ALTER TABLE topup_product_images 
          ALTER COLUMN image_type SET DEFAULT 'image/jpeg'
        `);
        console.log('✅ image_type default updated\n');
      } catch (e) {
        console.log('⚠️  image_type default: ' + e.message + '\n');
      }
    }
    
    // Add indexes if missing
    console.log('📚 Creating indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_topup_product_images_topup_product_id 
        ON topup_product_images(topup_product_id)
      `);
      console.log('✅ Index on topup_product_id added\n');
    } catch (e) {
      console.log('⚠️  Index: ' + e.message + '\n');
    }
    
    // Show final schema
    const finalResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'topup_product_images'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final table schema:\n');
    finalResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
      console.log(`   ✓ ${row.column_name} (${row.data_type})${defaultVal} ${nullable}`);
    });
    
    console.log('\n✅ Schema update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateImageTable();

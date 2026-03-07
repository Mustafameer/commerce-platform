import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  connectionTimeoutMillis: 5000,
});

async function applyMigration() {
  try {
    console.log('Applying migration: Adding gallery column to products table...');
    
    // Check if gallery column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='gallery';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Gallery column already exists. No migration needed.');
      process.exit(0);
    }
    
    // Add gallery column
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN gallery JSONB DEFAULT '[]';
    `);
    
    console.log('✅ Successfully added gallery column to products table');
    
    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_gallery ON products USING GIN(gallery);
    `);
    
    console.log('✅ Created index on gallery column');
    
    // Show table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Current products table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', (error as any)?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();

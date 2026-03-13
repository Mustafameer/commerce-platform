import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pn4YFPNT7TaTG@localhost:5432/commerce_app'
});

async function addIsActiveToStores() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Checking if is_active column exists in stores table...');
    
    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'is_active'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column is_active already exists in stores table');
      return;
    }
    
    console.log('➕ Adding is_active column to stores table...');
    
    // Add is_active column with default value TRUE
    await client.query(`
      ALTER TABLE stores 
      ADD COLUMN is_active BOOLEAN DEFAULT TRUE
    `);
    
    console.log('✅ Successfully added is_active column to stores table');
    console.log('📊 All stores are now marked as active (is_active = TRUE)');
    
  } catch (error) {
    console.error('❌ Error adding is_active column:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addIsActiveToStores()
  .then(() => console.log('✨ Migration completed successfully'))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

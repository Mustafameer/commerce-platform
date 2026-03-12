import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

async function addImagesColumn() {
  try {
    console.log('🔄 Checking if images column exists...');
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='topup_products' AND column_name='images'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column "images" already exists');
      process.exit(0);
    }
    
    console.log('➕ Adding "images" column to topup_products table...');
    
    // Add images column if it doesn't exist
    await pool.query(`
      ALTER TABLE topup_products 
      ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[]
    `);
    
    console.log('✅ Column "images" added successfully');
    console.log('📝 Column type: TEXT[] (array of image URLs/base64 data)');
    
    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='topup_products' AND column_name='images'
    `);
    
    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log(`✅ Verified: ${col.column_name} - ${col.data_type}`);
    }
    
    console.log('\n✅ Database schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addImagesColumn();

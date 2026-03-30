import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function makeImageDataNullable() {
  try {
    console.log('🔧 Making image_data column nullable...\n');
    
    await pool.query(`
      ALTER TABLE topup_product_images 
      ALTER COLUMN image_data DROP NOT NULL
    `);
    
    console.log('✅ image_data is now nullable\n');
    
    // Check current state
    const schema = await pool.query(`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'topup_product_images'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current schema:\n');
    schema.rows.forEach(row => {
      console.log(`   • ${row.column_name}`);
      console.log(`     - Type: ${row.data_type}`);
      console.log(`     - Nullable: ${row.is_nullable}`);
      if (row.column_default) {
        console.log(`     - Default: ${row.column_default}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

makeImageDataNullable();

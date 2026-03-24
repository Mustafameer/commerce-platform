import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/commerce_platform'
});

async function createCouponsTable() {
  try {
    console.log('🔄 Creating coupons table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
        max_uses INTEGER,
        usage_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Coupons table created successfully!');
    
    // Verify table
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'coupons'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Table verified in database');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating coupons table:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createCouponsTable();

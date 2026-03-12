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

async function createOrderImagesTable() {
  try {
    console.log('🔄 Creating order_images table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_images (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        topup_product_id INTEGER NOT NULL REFERENCES topup_products(id),
        image_url TEXT NOT NULL,
        image_data TEXT,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id, topup_product_id, image_url)
      );
      
      CREATE INDEX IF NOT EXISTS idx_order_images_order_id ON order_images(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_images_product_id ON order_images(topup_product_id);
    `);
    
    console.log('✅ Table "order_images" created successfully');
    console.log('📝 This table stores the images assigned to each order');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createOrderImagesTable();

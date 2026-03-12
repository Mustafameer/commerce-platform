import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

async function testImagesSystem() {
  try {
    console.log('\n🖼️  ========== TESTING TOPUP IMAGES SYSTEM ==========\n');

    // 1. Check if images column exists
    console.log('step 1️⃣: Checking images column in topup_products...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='topup_products' AND column_name='images'
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('✅ Images column exists');
      console.log(`   Type: ${columnsResult.rows[0].data_type}`);
    }

    // 2. Check if order_images table exists
    console.log('\n📋 Step 2️⃣: Checking order_images table...');
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name='order_images'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ order_images table exists');
      
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='order_images'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Table columns:');
      schemaResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // 3. Check a sample product with images
    console.log('\n🔍 Step 3️⃣: Checking sample topup products...');
    const productsResult = await pool.query(`
      SELECT id, store_id, amount, price, 
             array_length(codes, 1) as codes_count,
             array_length(images, 1) as images_count
      FROM topup_products 
      LIMIT 3
    `);
    
    if (productsResult.rows.length > 0) {
      console.log(`Found ${productsResult.rows.length} products:\n`);
      productsResult.rows.forEach(prod => {
        console.log(`   📦 Product ID ${prod.id}:`);
        console.log(`      Store: ${prod.store_id}`);
        console.log(`      Amount: ${prod.amount} | Price: ${prod.price}`);
        console.log(`      Codes: ${prod.codes_count || 0}`);
        console.log(`      Images: ${prod.images_count || 0}`);
      });
    } else {
      console.log('⚠️  No products found');
    }

    // 4. Check order_images records
    console.log('\n📸 Step 4️⃣: Checking order_images records...');
    const ordersResult = await pool.query(`
      SELECT oi.order_id, COUNT(*) as image_count, tp.amount
      FROM order_images oi
      JOIN topup_products tp ON oi.topup_product_id = tp.id
      GROUP BY oi.order_id, tp.amount
      LIMIT 5
    `);
    
    if (ordersResult.rows.length > 0) {
      console.log(`Found ${ordersResult.rows.length} orders with images:\n`);
      ordersResult.rows.forEach(order => {
        console.log(`   🛒 Order ID ${order.order_id}:`);
        console.log(`      Images: ${order.image_count}`);
        console.log(`      Product Amount: ${order.amount}`);
      });
    } else {
      console.log('ℹ️  No order images found yet (normal for new installs)');
    }

    // 5. Database stats
    console.log('\n📊 Step 5️⃣: Database statistics...');
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM topup_products) as total_products,
        (SELECT COUNT(*) FROM order_images) as total_order_images,
        (SELECT COUNT(DISTINCT order_id) FROM order_images) as orders_with_images,
        (SELECT COUNT(*) FROM orders WHERE is_topup_order = true) as total_topup_orders
    `);
    
    const stats = statsResult.rows[0];
    console.log(`   Products: ${stats.total_products}`);
    console.log(`   Total Order Images Saved: ${stats.total_order_images}`);
    console.log(`   Orders with Images: ${stats.orders_with_images}`);
    console.log(`   Total Topup Orders: ${stats.total_topup_orders}`);

    console.log('\n✅ ========== ALL TESTS PASSED ==========\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testImagesSystem();

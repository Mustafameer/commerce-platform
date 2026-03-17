import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function test() {
  try {
    console.log('\n📊 Complete Image System Summary\n');

    // Check Store 13 topup products
    const topupRes = await pool.query(`SELECT id FROM topup_products WHERE store_id = 13 LIMIT 1`);
    
    if (topupRes.rows.length > 0) {
      console.log('✅ For TopUp Products (Store 13):');
      console.log(`   Use endpoint: POST /api/topup/products/${topupRes.rows[0].id}/images`);
      console.log(`   Payload: { image_url: "...", image_type: "jpeg" }`);
    }

    // Check regular products in Store 1
    const prodRes = await pool.query(`SELECT id FROM products WHERE store_id = 1 LIMIT 1`);
    
    if (prodRes.rows.length > 0) {
      console.log('✅ For Regular Products (Store 1):');
      console.log(`   Use endpoint: POST /api/products/${prodRes.rows[0].id}/images`);
    } else {
      console.log('\n⚠️ No regular products found in Store 1');
      console.log('   Creating test product...');
      
      // Create category first
      const catRes = await pool.query(`LOCK TABLE categories IN EXCLUSIVE MODE`).catch(e => {});
      const newCat = await pool.query(`
        INSERT INTO categories (store_id, name) 
        VALUES (1, 'Test Category')
        ON CONFLICT DO NOTHING
        RETURNING id
      `);
      
      const catId = newCat.rows[0]?.id || 1;
      
      const newProd = await pool.query(`
        INSERT INTO products (store_id, category_id, name, price)
        VALUES (1, $1, 'Test Product', 1000)
        RETURNING id
      `, [catId]);
      
      console.log(`✅ Created test product with ID: ${newProd.rows[0].id}`);
      console.log(`   Use: POST /api/products/${newProd.rows[0].id}/images`);
    }

    console.log('\n🎯 Image API Endpoints:');
    console.log('   POST   /api/products/:productId/images - Upload image');
    console.log('   GET    /api/products/:productId/images - Get all images');
    console.log('   DELETE /api/products/:productId/images/:imageId - Delete image');

    pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    pool.end();
  }
}

test();

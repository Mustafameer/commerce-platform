import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/multi_ecommerce'
});

async function cleanupBase64Images() {
  try {
    console.log('🔍 Scanning topup_products for base64 images...');
    
    const result = await pool.query(`
      SELECT id, store_id, images 
      FROM topup_products 
      WHERE images IS NOT NULL 
      AND (
        images::text LIKE 'data:image%' 
        OR images::text LIKE '{%data:image%'
        OR images::text LIKE '%base64%'
      )
      ORDER BY id DESC LIMIT 20
    `);
    
    console.log(`\n📊 Found ${result.rows.length} products with base64 images\n`);
    
    for (const row of result.rows) {
      console.log(`\n📌 Product ID: ${row.id}, Store: ${row.store_id}`);
      console.log(`   Current data: ${typeof row.images === 'string' ? row.images.substring(0, 80) : JSON.stringify(row.images).substring(0, 80)}...`);
      
      // Set images to empty array
      await pool.query(`UPDATE topup_products SET images = '[]' WHERE id = $1`, [row.id]);
      console.log(`   ✅ Cleaned: images set to []`);
    }
    
    console.log('\n\n✅ Cleanup complete!');
    console.log('\nTo verify, check database:');
    console.log('SELECT id, images FROM topup_products WHERE images != \'[]\'');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupBase64Images();

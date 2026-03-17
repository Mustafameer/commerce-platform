import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function checkImages() {
  try {
    console.log('\n✅ TESTING TOPUP PRODUCT IMAGES\n');
    
    const images = await pool.query(`
      SELECT 
        tpi.id,
        tpi.topup_product_id,
        tpi.image_type,
        LENGTH(tpi.image_data) as image_size,
        tp.amount,
        tc.name,
        LEFT(tpi.image_data, 50) as preview
      FROM topup_product_images tpi
      JOIN topup_products tp ON tpi.topup_product_id = tp.id
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      ORDER BY tpi.topup_product_id
    `);

    console.log('📸 Product Images:\n');
    images.rows.forEach((img, i) => {
      console.log(`${i + 1}. Product ID: ${img.topup_product_id}`);
      console.log(`   Company: ${img.name}`);
      console.log(`   Amount: ${img.amount} SAR`);
      console.log(`   Image Type: ${img.image_type}`);
      console.log(`   Size: ${img.image_size} bytes`);
      console.log(`   Preview: ${img.preview}...\n`);
    });

    console.log(`✅ Total Images: ${images.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkImages();

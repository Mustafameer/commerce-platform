import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function checkStore1() {
  try {
    console.log('🔍 جميع المنتجات في المتجر 1:\n');
    
    const res = await pool.query(
      `SELECT id, store_id, company_id, name, amount, price, retail_price, 
              array_length(images, 1) as images_count, 
              created_at 
       FROM products 
       WHERE store_id = 1 
       ORDER BY id`
    );
    
    console.log(`📊 إجمالي المنتجات: ${res.rows.length}\n`);
    
    res.rows.forEach(p => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID: ${p.id}`);
      console.log(`المبلغ: ${p.amount}`);
      console.log(`السعر: ${p.price}`);
      console.log(`سعر الجملة: ${p.retail_price}`);
      console.log(`الصور: ${p.images_count || 0}`);
      console.log(`الشركة: ${p.company_id}`);
    });
    
    console.log('\n\n🔴 منتجات بدون صور (مشكلة):');
    const noImages = res.rows.filter(p => !p.images_count);
    noImages.forEach(p => {
      console.log(`  - ID: ${p.id} | المبلغ: ${p.amount} | السعر: ${p.price}`);
    });
    
    console.log('\n\n🔴 منتجات بقيم صفر (مشكلة):');
    const zeroValues = res.rows.filter(p => p.amount === 0 || p.price === 0);
    zeroValues.forEach(p => {
      console.log(`  - ID: ${p.id} | المبلغ: ${p.amount} | السعر: ${p.price}`);
    });
    
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

checkStore1();

const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function test() {
  try {
    const userId = 14; 
    const storeName = 'متجر الاناقة للملابس الرجالية';
    const name = 'مصطفى علي المير';
    const category = 'عام';
    const slug = storeName.toLowerCase().replace(/\s+/g, '-');
    
    console.log('Inserting with slug:', slug);
    
    await pool.query(
      "INSERT INTO stores (owner_id, store_name, slug, status, owner_name, category, is_active) VALUES ($1, $2, $3, 'pending', $4, $5, FALSE)",
      [userId, storeName, slug, name, category]
    );
    console.log('Success');
  } catch (e) {
    console.error('Error detail:', e.message);
    console.error('Full error:', e);
  } finally {
    await pool.end();
  }
}

test();

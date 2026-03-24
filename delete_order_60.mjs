import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function deleteOrder() {
  try {
    await client.connect();
    
    console.log('🗑️ جاري حذف الطلب رقم 60...\n');
    
    const result = await client.query(`
      DELETE FROM orders WHERE id = 60
    `);
    
    console.log(`✅ تم حذف الطلب بنجاح!`);
    
    // Verify deletion
    const check = await client.query(`
      SELECT COUNT(*) as cnt FROM orders WHERE id = 60
    `);
    
    console.log(`التحقق: ${check.rows[0].cnt === 0 ? '✅ تم الحذف فعلاً' : '❌ لم يتم الحذف'}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

deleteOrder();

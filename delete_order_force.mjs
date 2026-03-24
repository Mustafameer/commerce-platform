import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function deleteOrderForcefully() {
  try {
    await client.connect();
    
    console.log('🗑️ جاري حذف الطلب رقم 60 مع أي بيانات مرتبطة...\n');
    
    // First check for related data
    const checkRelated = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM order_items WHERE order_id = 60) as items,
        (SELECT COUNT(*) FROM order_payments WHERE order_id = 60) as payments,
        (SELECT COUNT(*) FROM topup_orders WHERE id = 60) as in_topup_orders
    `);
    
    console.log('🔍 البيانات المرتبطة:');
    console.log(checkRelated.rows[0]);
    console.log('');
    
    // Delete from dependent tables first
    await client.query('DELETE FROM order_items WHERE order_id = 60');
    console.log('✅ تم حذف items');
    
    await client.query('DELETE FROM order_payments WHERE order_id = 60');
    console.log('✅ تم حذف payments');
    
    // Now delete the order
    const result = await client.query('DELETE FROM orders WHERE id = 60');
    console.log(`✅ تم حذف الطلب (${result.rowCount} صفوف)`);
    
    // Verify
    const verify = await client.query('SELECT COUNT(*) as cnt FROM orders WHERE id = 60');
    console.log(`\n✅ التحقق: ${verify.rows[0].cnt === '0' ? 'تم الحذف فعلاً' : 'لم يتم الحذف'}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

deleteOrderForcefully();

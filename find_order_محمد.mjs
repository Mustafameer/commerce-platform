import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkOrdersTable() {
  try {
    await client.connect();
    
    // Check orders for محمد (customer_id = 4)
    const result = await client.query(`
      SELECT o.id, o.customer_id, o.topup_customer_id, o.total_amount, o.status, o.created_at
      FROM orders o
      WHERE o.customer_id = 4 OR o.topup_customer_id = 4
      ORDER BY o.created_at DESC
      LIMIT 20
    `);
    
    console.log('📋 جميع الأوامر للعميل محمد (customer_id = 4):');
    console.log(`عدد الأوامر: ${result.rows.length}\n`);
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  customer_id: ${row.customer_id}, topup_customer_id: ${row.topup_customer_id}`);
      console.log(`  المبلغ: ${row.total_amount} د.ع`);
      console.log(`  الحالة: ${row.status}`);
      console.log(`  التاريخ: ${row.created_at}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

checkOrdersTable();

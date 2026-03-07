import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function testEndpoint() {
  try {
    console.log('🔍 اختبار endpoint الجديد `/api/topup/orders?storeId=13`:\n');
    
    const response = await fetch('http://localhost:3000/api/topup/orders?storeId=13');
    const data = await response.json();
    
    console.log(`✅ عدد الطلبات المرجعة: ${data.length}\n`);
    
    data.forEach(order => {
      console.log(`Order ID: ${order.id}`);
      console.log(`  is_topup_order: ${order.is_topup_order}`);
      console.log(`  total_amount: ${order.total_amount}`);
      console.log(`  status: ${order.status}`);
      console.log(`  created_at: ${order.created_at}`);
      console.log('');
    });
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

testEndpoint();

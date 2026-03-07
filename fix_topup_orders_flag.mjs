import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function fixTopupOrders() {
  try {
    console.log('🔧 Fixing topup orders...\n');
    
    // Update all orders for store 13 (علي الهادي) to be marked as topup orders
    const result = await pool.query(
      `UPDATE orders 
       SET is_topup_order = true 
       WHERE store_id = 13 
       RETURNING id, is_topup_order`
    );
    
    console.log(`✅ Updated ${result.rows.length} orders for store 13:\n`);
    result.rows.forEach(order => {
      console.log(`Order ${order.id}: is_topup_order = ${order.is_topup_order}`);
    });
    
    // Verify the fix
    console.log('\n\n🔍 Verifying /api/topup/orders?storeId=13:\n');
    const response = await fetch('http://localhost:3000/api/topup/orders?storeId=13');
    const data = await response.json();
    console.log(`✅ Now returns ${data.length} topup orders\n`);
    data.forEach(order => {
      console.log(`Order ${order.id}: ${order.total_amount} IQD - ${order.status}`);
    });
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

fixTopupOrders();

import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database Structure\n');
    
    // 1. Check topup_products columns
    console.log('1️⃣  Topup Products Table Structure:');
    const columnsRes = await dbPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_products' 
      ORDER BY ordinal_position
    `);
    
    columnsRes.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 2. Check if retail_price exists and has data
    console.log('\n2️⃣  Topup Products Data for Store 13:');
    const productsRes = await dbPool.query(`
      SELECT id, amount, price, retail_price, wholesale_price 
      FROM topup_products 
      WHERE store_id = 13
      LIMIT 1
    `);
    
    if (productsRes.rows.length > 0) {
      const p = productsRes.rows[0];
      console.log(`   ID: ${p.id}`);
      console.log(`   Amount: ${p.amount}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   Retail Price: ${p.retail_price}`);
      console.log(`   Wholesale Price: ${p.wholesale_price}`);
      
      if (!p.retail_price) {
        console.log('\n   ⚠️  WARNING: retail_price is NULL!');
      }
    }
    
    // 3. Check orders for customer 1
    console.log('\n3️⃣  Orders for Customer 1 (محمد المير):');
    const ordersRes = await dbPool.query(`
      SELECT 
        o.id, 
        o.total_amount, 
        oi.price as order_item_price,
        o.is_topup_order
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = 1
      ORDER BY o.id DESC
      LIMIT 5
    `);
    
    if (ordersRes.rows.length > 0) {
      ordersRes.rows.forEach(order => {
        console.log(`   Order ${order.id}: total_amount=${order.total_amount}, item_price=${order.order_item_price}, topup=${order.is_topup_order}`);
      });
    } else {
      console.log('   (No orders found)');
    }
    
    // 4. Check customer 1 debt
    console.log('\n4️⃣  Customer 1 Current Debt:');
    const custRes = await dbPool.query(`
      SELECT current_debt, credit_limit, customer_type
      FROM customers
      WHERE id = 1
    `);
    
    if (custRes.rows.length > 0) {
      const c = custRes.rows[0];
      console.log(`   Current Debt: ${c.current_debt}`);
      console.log(`   Credit Limit: ${c.credit_limit}`);
      console.log(`   Customer Type: ${c.customer_type}`);
    }
    
    await dbPool.end();
    console.log('\n✅ Database check complete');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkDatabase();

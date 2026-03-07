import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function debugPrices() {
  try {
    console.log('🔍 Detailed Price Debug\n');
    
    // 1. Check all products in store 13
    console.log('1️⃣  All Topup Products in Store 13:');
    const productsRes = await dbPool.query(`
      SELECT id, amount, price, retail_price, wholesale_price, is_active
      FROM topup_products 
      WHERE store_id = 13
      ORDER BY id DESC
    `);
    
    productsRes.rows.forEach(p => {
      console.log(`  ID ${p.id}: amount=${p.amount}, price=${p.price}, retail=${p.retail_price}, wholesale=${p.wholesale_price}, active=${p.is_active}`);
    });
    
    // 2. Check customer 1 and their favorite product
    console.log('\n2️⃣  Customer 1 Details:');
    const custRes = await dbPool.query(`
      SELECT id, name, phone, customer_type, current_debt
      FROM customers
      WHERE id = 1
    `);
    
    if (custRes.rows.length > 0) {
      const c = custRes.rows[0];
      console.log(`  ID: ${c.id}`);
      console.log(`  Name: ${c.name}`);
      console.log(`  Phone: ${c.phone}`);
      console.log(`  Type: ${c.customer_type}`);
      console.log(`  Current Debt: ${c.current_debt}`);
    }
    
    // 3. Check LAST order for customer 1
    console.log('\n3️⃣  Last Order for Customer 1:');
    const orderRes = await dbPool.query(`
      SELECT 
        o.id, 
        o.total_amount,
        o.customer_id,
        oi.topup_product_id,
        oi.price as item_price,
        tp.amount as product_amount,
        tp.price as product_base_price,
        tp.retail_price,
        tp.wholesale_price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
      WHERE o.customer_id = 1 AND o.is_topup_order = true
      ORDER BY o.id DESC
      LIMIT 1
    `);
    
    if (orderRes.rows.length > 0) {
      const order = orderRes.rows[0];
      console.log(`  Order ID: ${order.id}`);
      console.log(`  Total Amount: ${order.total_amount}`);
      console.log(`  Product ID: ${order.topup_product_id}`);
      console.log(`  Item Price: ${order.item_price}`);
      console.log(`  Product Amount: ${order.product_amount}`);
      console.log(`  Product Base Price: ${order.product_base_price}`);
      console.log(`  Product Retail Price: ${order.retail_price}`);
      console.log(`  Product Wholesale Price: ${order.wholesale_price}`);
      
      console.log('\n  💡 Analysis:');
      console.log(`  - Expected (reseller retail): ${order.retail_price}`);
      console.log(`  - Actual (saved debt): ${order.total_amount}`);
      console.log(`  - Match? ${order.total_amount === order.retail_price ? '✅ YES' : '❌ NO'}`);
    }
    
    await dbPool.end();
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

debugPrices();

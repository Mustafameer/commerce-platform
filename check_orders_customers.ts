import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkOrders() {
  try {
    // Check stores
    const storesResult = await pool.query("SELECT id, store_name, owner_id FROM stores");
    console.log("Stores:", storesResult.rows);
    
    const result = await pool.query("SELECT id, store_id, customer_id, phone FROM orders ORDER BY id DESC");
    console.log("\nOrders:", result.rows);
    
    // Check customers for store_id=3
    const customerResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spending
      FROM users u
      INNER JOIN orders o ON u.id = o.customer_id
      WHERE o.store_id = 3
      GROUP BY u.id, u.name, u.phone
    `);
    
    console.log("\nCustomers for store_id=3:", customerResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error("Error:", (error as any).message);
    await pool.end();
  }
}

checkOrders();

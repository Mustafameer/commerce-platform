const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce',
  user: 'postgres',
  password: 'root'
});

async function verify() {
  try {
    // Check stores
    console.log('====== STORES ======');
    const storesRes = await pool.query(
      `SELECT id, store_name, percentage_enabled, commission_percentage FROM stores`
    );
    console.table(storesRes.rows);

    // Check orders
    console.log('\n====== ORDERS ======');
    const ordersRes = await pool.query(
      `SELECT id, store_id, total_amount, status FROM orders`
    );
    console.table(ordersRes.rows);

    // Check calculation
    console.log('\n====== COMMISSION CALCULATION ======');
    const calcRes = await pool.query(`
      SELECT 
        s.id,
        s.store_name,
        s.percentage_enabled,
        s.commission_percentage,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        CASE 
          WHEN s.percentage_enabled AND s.commission_percentage > 0 THEN 
            FLOOR(COALESCE(SUM(o.total_amount), 0) * (s.commission_percentage / 100))
          ELSE 0
        END as commission
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id
      GROUP BY s.id, s.store_name, s.percentage_enabled, s.commission_percentage
    `);
    console.table(calcRes.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();

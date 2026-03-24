import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/Commerce_Platform'
});

(async () => {
  try {
    // Get customer 3 data
    const customerRes = await pool.query(
      'SELECT id, name, phone, starting_balance, current_debt, credit_limit FROM customers WHERE id = $1',
      [3]
    );
    console.log('\n📊 Customer 3 (from DB):');
    console.log(JSON.stringify(customerRes.rows[0], null, 2));
    
    // Get all orders for customer 3
    const ordersRes = await pool.query(
      'SELECT id, total_amount, status, created_at FROM orders WHERE topup_customer_id = $1 OR customer_id = $1 ORDER BY created_at',
      [3]
    );
    console.log('\n📦 Orders for customer 3:');
    let totalOrders = 0;
    ordersRes.rows.forEach(o => {
      console.log(`  Order ${o.id}: ${o.total_amount} د.ع (${o.status})`);
      totalOrders += Number(o.total_amount);
    });
    console.log(`Total orders: ${totalOrders} د.ع`);
    
    // Get all payments
    const paymentsRes = await pool.query(
      'SELECT id, amount, payment_method, created_at FROM customer_payments WHERE customer_id = $1 ORDER BY created_at',
      [3]
    );
    console.log('\n💳 Payments for customer 3:');
    let totalPayments = 0;
    paymentsRes.rows.forEach(p => {
      console.log(`  Payment ${p.id}: ${p.amount} د.ع`);
      totalPayments += Number(p.amount);
    });
    console.log(`Total payments: ${totalPayments} د.ع`);
    
    // Calculate
    const starting = Number(customerRes.rows[0].starting_balance);
    const calculatedDebt = starting + totalOrders - totalPayments;
    
    console.log('\n🎯 Calculation:');
    console.log(`  Starting: ${starting} د.ع`);
    console.log(`  + Orders: ${totalOrders} د.ع`);
    console.log(`  - Payments: ${totalPayments} د.ع`);
    console.log(`  = Calculated: ${calculatedDebt} د.ع`);
    console.log(`  DB current_debt: ${customerRes.rows[0].current_debt} د.ع`);
    console.log(`  Difference: ${Math.abs(calculatedDebt - Number(customerRes.rows[0].current_debt))} د.ع`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();

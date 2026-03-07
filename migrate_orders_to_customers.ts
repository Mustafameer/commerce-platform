import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function migrateOrdersToCustomers() {
  try {
    console.log('🔍 Starting migration of orders to customers...\n');

    // Get all orders with NULL customer_id
    const ordersResult = await pool.query(
      "SELECT DISTINCT id, phone, address FROM orders WHERE customer_id IS NULL ORDER BY id"
    );

    console.log(`📋 Found ${ordersResult.rows.length} orders without customers\n`);

    if (ordersResult.rows.length === 0) {
      console.log('✅ No orders to migrate');
      await pool.end();
      return;
    }

    // For each order, create a customer if not exists
    for (const order of ordersResult.rows) {
      try {
        // Check if customer with this phone already exists
        const customerCheck = await pool.query(
          "SELECT id FROM users WHERE phone = $1 AND role = 'customer'",
          [order.phone]
        );

        let customerId: number;

        if (customerCheck.rows.length > 0) {
          // Use existing customer
          customerId = customerCheck.rows[0].id;
          console.log(`📱 Order #${order.id}: Using existing customer ID ${customerId} for phone ${order.phone}`);
        } else {
          // Create new customer
          const createResult = await pool.query(
            "INSERT INTO users (name, phone, role, is_active, password) VALUES ($1, $2, 'customer', true, 'guest123') RETURNING id",
            [order.phone, order.phone]
          );
          customerId = createResult.rows[0].id;
          console.log(`✅ Order #${order.id}: Created new customer ID ${customerId} for phone ${order.phone}`);
        }

        // Update order with customer_id
        await pool.query(
          "UPDATE orders SET customer_id = $1 WHERE id = $2",
          [customerId, order.id]
        );

        console.log(`   ✔️  Updated order #${order.id} with customer_id ${customerId}\n`);
      } catch (error) {
        console.error(`❌ Error processing order #${order.id}:`, (error as any).message);
      }
    }

    console.log('✅ Migration completed!\n');

    // Show summary
    const summaryResult = await pool.query(
      "SELECT COUNT(DISTINCT customer_id) as customer_count, COUNT(*) as order_count FROM orders WHERE customer_id IS NOT NULL"
    );

    console.log('📊 Summary:');
    console.log(`   - Total customers: ${summaryResult.rows[0].customer_count}`);
    console.log(`   - Total orders with customers: ${summaryResult.rows[0].order_count}\n`);

    await pool.end();
  } catch (error) {
    console.error('Migration error:', (error as any).message);
    await pool.end();
    process.exit(1);
  }
}

migrateOrdersToCustomers();

import pkg from 'pg';
const { Pool } = pkg;

let connectionString = process.env.DATABASE_URL;

// If DATABASE_URL not set, use Railway production connection
if (!connectionString || !connectionString.includes("@")) {
  connectionString = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';
}

const pool = new Pool({
  connectionString,
});

async function clearData() {
  const client = await pool.connect();
  try {
    console.log('🗑️ جاري مسح جميع البيانات من الجداول...\n');

    // Clear customer transactions
    const resultTransactions = await client.query('DELETE FROM customer_transactions');
    console.log(`✓ تم حذف ${resultTransactions.rowCount} معاملة من customer_transactions`);

    // Clear customer payments
    const resultPayments = await client.query('DELETE FROM customer_payments');
    console.log(`✓ تم حذف ${resultPayments.rowCount} دفعة من customer_payments`);

    // Clear orders (topup orders only, not regular store orders)
    const resultOrders = await client.query('DELETE FROM orders WHERE customer_id IS NULL AND topup_customer_id IS NOT NULL');
    console.log(`✓ تم حذف ${resultOrders.rowCount} طلب توب أب من orders`);

    // Reset customers' debt to 0 and payment status
    const resultCustomers = await client.query(`
      UPDATE customers 
      SET current_debt = 0, payment_status = 'active'
      WHERE current_debt > 0 OR payment_status != 'active'
    `);
    console.log(`✓ تم تحديث ${resultCustomers.rowCount} عميل (إعادة تعيين الديون إلى صفر)`);

    console.log('\n✅ تم مسح جميع البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ أثناء مسح البيانات:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

clearData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

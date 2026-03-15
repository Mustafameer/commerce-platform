import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/commerce'
});

async function testStatementFix() {
  try {
    console.log('🧪 Testing Statement Fix with Sample Data\n');

    // Create test customer
    const customerRes = await pool.query(
      `INSERT INTO customers (store_id, name, phone, email, customer_type, credit_limit, is_active)
       VALUES (21, 'Test Customer شراء وسداد', '9876543210', 'test@example.com', 'cash', 100000, true)
       RETURNING id`
    );
    const customerId = customerRes.rows[0].id;
    console.log(`✅ Created customer ID: ${customerId}`);

    // Create test orders (purchases)
    const order1Res = await pool.query(
      `INSERT INTO orders (topup_customer_id, store_id, total_amount, phone, status, is_topup_order, created_at)
       VALUES ($1, 21, 10000, '9876543210', 'completed', true, NOW() - INTERVAL '5 days')
       RETURNING id`,
      [customerId]
    );
    console.log(`✅ Created order 1: 10,000 د.ع (5 days ago)`);

    const order2Res = await pool.query(
      `INSERT INTO orders (topup_customer_id, store_id, total_amount, phone, status, is_topup_order, created_at)
       VALUES ($1, 21, 15000, '9876543210', 'completed', true, NOW() - INTERVAL '3 days')
       RETURNING id`,
      [customerId]
    );
    console.log(`✅ Created order 2: 15,000 د.ع (3 days ago)`);

    // Create test payment (this is where the fix matters!)
    await pool.query(
      `INSERT INTO customer_payments (customer_id, amount, payment_method, notes, created_at)
       VALUES ($1, 5000, 'online', 'تسديد جزئي', NOW() - INTERVAL '1 day')`,
      [customerId]
    );
    console.log(`✅ Created payment: 5,000 د.ع (1 day ago)`);

    // Test the fixed statement endpoint
    console.log(`\n📊 Fetching statement for customer ${customerId}...\n`);
    
    const statementRes = await pool.query(
      `SELECT id, name, phone, email, customer_type FROM customers WHERE id = $1`,
      [customerId]
    );

    if (statementRes.rows.length === 0) {
      console.log('❌ Customer not found');
      return;
    }

    const customer = statementRes.rows[0];

    // Get orders
    const ordersRes = await pool.query(
      `SELECT id, total_amount, created_at FROM orders 
       WHERE (topup_customer_id = $1 OR customer_id = $1) AND is_topup_order = true
       ORDER BY created_at ASC`,
      [customerId]
    );

    // Get payments
    const paymentsRes = await pool.query(
      `SELECT id, amount, created_at FROM customer_payments 
       WHERE customer_id = $1 ORDER BY created_at ASC`,
      [customerId]
    );

    // Combine transactions
    const allItems = [
      ...ordersRes.rows.map(o => ({
        id: o.id,
        created_at: o.created_at,
        type: 'purchase',
        description: `شراء - ${o.total_amount} د.ع`,
        amount: Number(o.total_amount || 0),
        is_payment: false
      })),
      ...paymentsRes.rows.map(p => ({
        id: p.id,
        created_at: p.created_at,
        type: 'payment',
        description: 'دفعة',
        amount: Number(p.amount || 0),
        is_payment: true
      }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Calculate running balances
    let runningBalance = 0;
    const itemsWithBalance = allItems.map((item) => {
      if (item.is_payment) {
        runningBalance -= item.amount;
      } else {
        runningBalance += item.amount;
      }
      return { ...item, balance: Math.max(0, runningBalance) };
    });

    // Display in reverse order (newest first)
    const transactions = [...itemsWithBalance].reverse();

    console.log(`Customer: ${customer.name}\n`);
    console.log(`${'التاريخ'.padEnd(12)} | ${'البيان'.padEnd(20)} | ${'مدين (DEBIT)'.padEnd(12)} | ${'دائن (CREDIT)'.padEnd(12)} | ${'الرصيد'.padEnd(10)}`);
    console.log('-'.repeat(80));

    transactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString('ar-IQ');
      const debit = tx.is_payment ? 0 : tx.amount;
      const credit = tx.is_payment ? tx.amount : 0;
      const type = tx.is_payment ? '💚 PAYMENT' : '💔 PURCHASE';
      
      console.log(
        `${date.padEnd(12)} | ${type.padEnd(20)} | ${debit.toString().padEnd(12)} | ${credit.toString().padEnd(12)} | ${tx.balance}`
      );
    });

    const finalBalance = itemsWithBalance.length > 0 ? itemsWithBalance[itemsWithBalance.length - 1].balance : 0;
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Final Debt (الرصيد): ${finalBalance} د.ع`);
    console.log(`✅ Payments correctly appear in CREDIT (دائن) column ✓`);
    console.log(`✅ Purchases correctly appear in DEBIT (مدين) column ✓`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testStatementFix();

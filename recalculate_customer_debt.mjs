import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/commerce_platform';

const client = new Client({
  connectionString: connectionString
});

async function recalculateDebt() {
  try {
    await client.connect();
    console.log('🔄 جاري إعادة حساب الديون للعملاء...\n');

    // Get all topup customers
    const customersResult = await client.query(`
      SELECT id, name, phone, starting_balance, current_debt
      FROM topup_customers
      ORDER BY created_at DESC
    `);

    console.log(`📊 وجدت ${customersResult.rows.length} عميل\n`);

    for (const customer of customersResult.rows) {
      const customerId = customer.id;
      
      // Get opening balance (starting_balance - immutable)
      const openingBalance = Number(customer.starting_balance || 0);
      
      // Get all orders (purchases)
      const ordersResult = await client.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_purchases
        FROM topup_orders
        WHERE customer_id = $1
      `, [customerId]);
      
      const totalPurchases = Number(ordersResult.rows[0]?.total_purchases || 0);
      
      // Get all payments
      const paymentsResult = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total_payments
        FROM customer_payments
        WHERE customer_id = $1
      `, [customerId]);
      
      const totalPayments = Number(paymentsResult.rows[0]?.total_payments || 0);
      
      // Calculate correct debt
      // الديون = الديون السابقة + الشراءات - الدفعات
      const correctDebt = Math.max(0, openingBalance + totalPurchases - totalPayments);
      
      console.log(`👤 ${customer.name} (${customer.phone})`);
      console.log(`   ديون سابقة: ${openingBalance} د.ع`);
      console.log(`   شراءات: +${totalPurchases} د.ع`);
      console.log(`   دفعات: -${totalPayments} د.ع`);
      console.log(`   الديون الحالية (قديمة): ${customer.current_debt} د.ع`);
      console.log(`   الديون الحالية (صحيحة): ${correctDebt} د.ع`);
      
      if (Math.abs(correctDebt - customer.current_debt) > 0.01) {
        console.log(`   ⚠️  تحديث البيانات...\n`);
        await client.query(`
          UPDATE topup_customers
          SET current_debt = $1, updated_at = NOW()
          WHERE id = $2
        `, [correctDebt, customerId]);
        console.log(`   ✅ تم التحديث\n`);
      } else {
        console.log(`   ✓ البيانات صحيحة\n`);
      }
    }

    console.log('✅ اكتمل إعادة حساب الديون بنجاح!');
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.end();
  }
}

recalculateDebt();

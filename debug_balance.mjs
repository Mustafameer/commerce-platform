import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/ecommerce_db'
});

// Get customer with phone 07810909577
const customerRes = await pool.query(`
  SELECT id, name, phone, credit_limit, current_debt, starting_balance 
  FROM customers 
  WHERE phone = '07810909577'
`);

if (customerRes.rows.length === 0) {
  console.log('❌ Customer not found');
  process.exit(0);
}

const customer = customerRes.rows[0];
console.log('👤 Customer:', customer);

// Get transactions
const txRes = await pool.query(`
  SELECT id, customer_id, transaction_type, amount, created_at
  FROM customer_transactions 
  WHERE customer_id = $1 
  ORDER BY created_at ASC
`, [customer.id]);

console.log('\n💰 Transactions:');
txRes.rows.forEach((t, i) => {
  console.log(`   [${i}] ${t.transaction_type}: ${t.amount}`);
});

// Get payments
const payRes = await pool.query(`
  SELECT id, customer_id, amount, created_at
  FROM customer_payments 
  WHERE customer_id = $1 
  ORDER BY created_at ASC
`, [customer.id]);

console.log('\n💳 Payments:');
payRes.rows.forEach((p, i) => {
  console.log(`   [${i}] Payment: ${p.amount}`);
});

// Calculate expected balance
let initialDebt = customer.starting_balance || 0;
let totalPayments = 0;
let totalDebits = 0;

txRes.rows.forEach(t => totalDebits += t.amount);
payRes.rows.forEach(p => totalPayments += p.amount);

initialDebt = (customer.current_debt || 0) + totalPayments - totalDebits;

console.log('\n📊 Calculation:');
console.log(`   current_debt (DB): ${customer.current_debt}`);
console.log(`   Total Payments: ${totalPayments}`);
console.log(`   Total Debits: ${totalDebits}`);
console.log(`   Calculated initialDebt: ${customer.current_debt} + ${totalPayments} - ${totalDebits} = ${initialDebt}`);

// Show expected running balances
console.log('\n📈 Expected Running Balances:');
let runningBalance = initialDebt;
console.log(`   Opening: ${runningBalance}`);

txRes.rows.forEach((t, i) => {
  runningBalance += t.amount;
  console.log(`   After debit [${i}]: ${runningBalance}`);
});

payRes.rows.forEach((p, i) => {
  runningBalance -= p.amount;
  console.log(`   After payment [${i}]: ${runningBalance}`);
});

console.log(`   Final balance should be: ${runningBalance} (should match current_debt: ${customer.current_debt})`);

await pool.end();
process.exit(0);

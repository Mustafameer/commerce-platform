const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:mlxLhMw1fZl6vNc@bayt-aneeq-prod-pg-cnpg-c.g.aivencloud.com:28854/bayt_aneeq_db?sslmode=require'
});

(async () => {
  try {
    // Check customers table structure
    const customersRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Customers Table Structure:');
    customersRes.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // Check if there's data
    const dataRes = await pool.query('SELECT COUNT(*) FROM customers');
    console.log(`\n📊 Total Customers: ${dataRes.rows[0].count}`);

    // Check customer_transactions
    const txRes = await pool.query('SELECT COUNT(*) FROM customer_transactions');
    console.log(`📊 Total Transactions: ${txRes.rows[0].count}`);

    // Get sample customers
    const sampleRes = await pool.query('SELECT id, name, phone, starting_balance, current_debt, credit_limit, created_at FROM customers LIMIT 3');
    if (sampleRes.rows.length > 0) {
      console.log('\n🎯 Sample Customers:');
      sampleRes.rows.forEach(c => {
        console.log(`  - ${c.name} (${c.phone}): Balance=${c.starting_balance}, Debt=${c.current_debt}, Credit=${c.credit_limit}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

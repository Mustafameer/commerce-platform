import { Pool } from 'pg';

async function checkCustomersTable() {
  const pool = new Pool({
    user: 'postgres',
    password: '123',
    host: 'localhost',
    port: 5432,
    database: 'multi_ecommerce'
  });

  try {
    // Get table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Customers table columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if customer_type and email exist
    const hasCustomerType = result.rows.some(r => r.column_name === 'customer_type');
    const hasEmail = result.rows.some(r => r.column_name === 'email');
    
    console.log(`\n✓ customer_type exists: ${hasCustomerType}`);
    console.log(`✓ email exists: ${hasEmail}`);

    // Get sample data
    const dataResult = await pool.query('SELECT * FROM customers LIMIT 1');
    console.log('\n📊 Sample customer data columns:', Object.keys(dataResult.rows[0] || {}));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCustomersTable();

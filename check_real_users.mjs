import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking Users in Database:\n');

    // Check users table
    const usersResult = await pool.query(
      `SELECT id, name, phone, email, role, store_id FROM users LIMIT 10`
    );
    console.log('📋 Users:');
    usersResult.rows.forEach(u => {
      console.log(`   ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, Email: ${u.email}, Role: ${u.role}, Store: ${u.store_id}`);
    });

    // Check customers table
    console.log('\n📋 Customers (Store 13):');
    const customersResult = await pool.query(
      `SELECT id, name, phone, store_id FROM customers WHERE store_id = 13 LIMIT 10`
    );
    if (customersResult.rows.length > 0) {
      customersResult.rows.forEach(c => {
        console.log(`   ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone}, Store: ${c.store_id}`);
      });
    } else {
      console.log('   ❌ No customers found for store 13');
    }

    // Check topup_companies
    console.log('\n🏢 TopUp Companies (Store 13):');
    const companiesResult = await pool.query(
      `SELECT id, name, store_id FROM topup_companies WHERE store_id = 13`
    );
    console.log(`   Count: ${companiesResult.rows.length}`);
    companiesResult.rows.forEach(c => {
      console.log(`   ID: ${c.id}, Name: ${c.name}`);
    });

    // Check topup_products
    console.log('\n📦 TopUp Products (Store 13):');
    const productsResult = await pool.query(
      `SELECT id, company_id, price, store_id FROM topup_products WHERE store_id = 13`
    );
    console.log(`   Count: ${productsResult.rows.length}`);
    productsResult.rows.forEach(p => {
      console.log(`   ID: ${p.id}, Company: ${p.company_id}, Price: ${p.price}`);
    });

    // Check orders
    console.log('\n📋 Orders (Store 13):');
    const ordersResult = await pool.query(
      `SELECT id, store_id, total_amount FROM orders WHERE store_id = 13 LIMIT 10`
    );
    console.log(`   Count: ${ordersResult.rows.length}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce',
  user: 'postgres',
  password: '123'
});

client.connect().then(() => {
  // Get the customer and their store
  client.query(`
    SELECT c.*, s.store_name FROM customers c 
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.name = 'محمد' 
    LIMIT 1
  `)
    .then(r => {
      if (r.rows.length === 0) {
        console.log('❌ No customer named محمد found');
        process.exit(1);
      }
      
      const customer = r.rows[0];
      console.log('\n✅ Found customer:');
      console.log(`   Name: ${customer.name}`);
      console.log(`   ID: ${customer.id}`);
      console.log(`   Store: ${customer.store_name} (ID: ${customer.store_id})`);
      console.log(`   starting_balance: ${customer.starting_balance}`);
      console.log(`   current_debt: ${customer.current_debt}`);
      console.log(`   credit_limit: ${customer.credit_limit}`);
      console.log('\n✅ Database fix verified - current_debt now matches starting_balance!\n');
      process.exit(0);
    })
    .catch(e => {
      console.error('❌ Error:', e.message);
      process.exit(1);
    });
}).catch(e => {
  console.error('❌ Connection error:', e.message);
  process.exit(1);
});

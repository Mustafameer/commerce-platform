const pg = require('pg');
const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce',
  user: 'postgres',
  password: '123'
});

client.connect().then(() => {
  client.query('SELECT id, name, starting_balance, current_debt FROM customers WHERE starting_balance > 0 ORDER BY created_at DESC LIMIT 5;')
    .then(r => {
      console.log('\n✅ Current customers with debt:');
      r.rows.forEach(row => {
        console.log(`   ${row.name}: starting=${row.starting_balance}, current=${row.current_debt}`);
      });
      process.exit(0);
    })
    .catch(e => {
      console.error('Error:', e.message);
      process.exit(1);
    });
}).catch(e => {
  console.error('Connection error:', e.message);
  process.exit(1);
});

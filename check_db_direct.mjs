import { execSync } from 'child_process';

// Use direct terminal command to check database
try {
  const env = {
    ...process.env,
    PGPASSWORD: '4fR9y2m8VxKl'
  };
  
  console.log('🔍 Checking for store_id = 21 in database...\n');
  
  // Check tables for store_id = 21
  const checkUsers = execSync(
    'psql -h web-production-9efff.up.railway.app -U admin -d multi_ecommerce -c "SELECT COUNT(*) as count FROM users WHERE store_id = 21;"',
    { env, encoding: 'utf8' }
  );
  console.log('Users with store_id = 21:', checkUsers);
  
  const checkCustomers = execSync(
    'psql -h web-production-9efff.up.railway.app -U admin -d multi_ecommerce -c "SELECT COUNT(*) as count FROM customers WHERE store_id = 21;"',
    { env, encoding: 'utf8' }
  );
  console.log('Customers with store_id = 21:', checkCustomers);
  
  const checkStore21 = execSync(
    'psql -h web-production-9efff.up.railway.app -U admin -d multi_ecommerce -c "SELECT * FROM stores WHERE id = 21;"',
    { env, encoding: 'utf8' }
  );
  console.log('Store 21 data:', checkStore21);
} catch (e) {
  console.error('Error:', e.message);
}

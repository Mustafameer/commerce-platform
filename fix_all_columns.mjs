import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function fixAllColumns() {
  const queries = [
    `ALTER TABLE app_settings ADD COLUMN admin_commission_percentage DECIMAL(5,2)`,
    `ALTER TABLE app_settings ADD COLUMN admin_commission_amount DECIMAL(10,2)`,
    `ALTER TABLE app_settings ADD COLUMN admin_welcome_message TEXT`,
    `ALTER TABLE stores ADD COLUMN phone VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false`,
    `ALTER TABLE customers ADD COLUMN phone_verified BOOLEAN DEFAULT false`,
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
      console.log(`✅ ${q.split(' ADD ')[1]}`);
    } catch (e) {
      if (e.code !== '42701') console.log(`❌ ${q}: ${e.message}`);
    }
  }

  console.log('\nDone');
  await pool.end();
}

fixAllColumns();

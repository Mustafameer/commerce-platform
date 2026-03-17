import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function createBaytAneeq() {
  try {
    console.log('✏️  Creating Bayt Aneeq Store...\n');

    // Create store
    const storeResult = await pool.query(
      `INSERT INTO stores (store_name, slug, is_active, status, commission_percentage)
       VALUES ('البيت الانيق', 'bayt-aneeq', true, 'active', 5)
       RETURNING id`
    );
    
    const storeId = storeResult.rows[0].id;
    console.log(`✅ Created store: ID ${storeId} - bayt-aneeq`);

    // Create merchant user for this store
    const userResult = await pool.query(
      `INSERT INTO users (name, phone, email, password, role, store_id)
       VALUES ('صاحب البيت الانيق', '0781234567', 'bayt-aneeq@commerce.local', 'password', 'merchant', $1)
       RETURNING id`
    );
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Created user: ID ${userId} - صاحب البيت الانيق`);
    console.log(`   Phone: 0781234567`);
    console.log(`   Password: password`);

    console.log('\n✅ Store setup complete!');
    console.log('\n📊 Current Stores:');

    // Show all stores
    const storesResult = await pool.query(
      `SELECT id, slug, store_type, is_active FROM stores ORDER BY id`
    );
    
    storesResult.rows.forEach(s => {
      console.log(`   - Store ${s.id}: ${s.slug} (${s.store_type || 'regular'})`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createBaytAneeq();

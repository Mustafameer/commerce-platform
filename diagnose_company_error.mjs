import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@junction.proxy.rlwy.net:18175/railway',
  ssl: { rejectUnauthorized: false },
});

async function diagnoseCompanyError() {
  try {
    console.log('\n🔍 DIAGNOSTIC: Testing Company Creation on Railway\n');
    console.log('=' .repeat(60));

    // 1. Check if store 13 exists
    console.log('\n1️⃣  Checking if Store 13 exists...');
    const storeCheck = await pool.query('SELECT id, store_name, store_type FROM stores WHERE id = 13');
    
    if (storeCheck.rows.length === 0) {
      console.log('   ❌ Store 13 DOES NOT EXIST - Creating it now...\n');
      
      // Create store
      const createStore = await pool.query(`
        INSERT INTO stores (store_name, slug, owner_name, owner_phone, category, status, is_active, store_type) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, store_name, store_type
      `, ['Topup Store', 'topup-main', 'Topup Admin', '+964', 'شحن', 'approved', true, 'topup']);
      
      const newStoreId = createStore.rows[0].id;
      console.log('   ✅ Store created with ID:', newStoreId);
      console.log('   ✅ Store Name:', createStore.rows[0].store_name);
      console.log('   ✅ Store Type:', createStore.rows[0].store_type);
      
      // Now check if store 13 or the new ID exists
      const updatedCheck = await pool.query('SELECT id FROM stores WHERE id IN (13, $1) LIMIT 1', [newStoreId]);
      if (updatedCheck.rows.length > 0) {
        console.log('\n   📊 Store is now available with ID:', updatedCheck.rows[0].id);
      }
    } else {
      console.log('   ✅ Store 13 EXISTS');
      console.log('   • Name:', storeCheck.rows[0].store_name);
      console.log('   • Type:', storeCheck.rows[0].store_type);
    }

    // 2. Check topup_companies table structure
    console.log('\n2️⃣  Checking topup_companies table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'topup_companies'
      ORDER BY ordinal_position
    `);

    if (tableInfo.rows.length === 0) {
      console.log('   ❌ Table does not exist! Creating it...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS topup_companies (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id),
          name VARCHAR(255),
          logo_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Table created successfully');
    } else {
      console.log('   ✅ Table exists with columns:');
      tableInfo.rows.forEach(col => {
        console.log(`      • ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '⚠️ NOT NULL' : ''}`);
      });
    }

    // 3. Test inserting a company
    console.log('\n3️⃣  Testing company insertion...');
    const testCompanyName = 'Test Company ' + new Date().getTime();
    
    try {
      const insertResult = await pool.query(
        `INSERT INTO topup_companies (store_id, name, logo_url) 
         VALUES ($1, $2, $3) RETURNING *`,
        [13, testCompanyName, null]
      );

      console.log('   ✅ Company inserted successfully!');
      console.log('   • ID:', insertResult.rows[0].id);
      console.log('   • Name:', insertResult.rows[0].name);
      console.log('   • Store ID:', insertResult.rows[0].store_id);
      
      // Delete the test company
      await pool.query('DELETE FROM topup_companies WHERE id = $1', [insertResult.rows[0].id]);
      console.log('   ✅ Test company deleted');
      
    } catch (insertErr) {
      console.log('   ❌ INSERT FAILED!');
      console.log('   Error:', insertErr.message);
      console.log('   Code:', insertErr.code);
      console.log('   Detail:', insertErr.detail);
      
      // Try with store_id = 1 instead
      console.log('\n   🔄 Trying with store_id = 1...');
      try {
        const checkStore1 = await pool.query('SELECT id FROM stores WHERE id = 1');
        if (checkStore1.rows.length > 0) {
          const insertResult = await pool.query(
            `INSERT INTO topup_companies (store_id, name, logo_url) 
             VALUES ($1, $2, $3) RETURNING *`,
            [1, testCompanyName + ' (Store 1)', null]
          );
          console.log('   ✅ Company inserted with store_id = 1');
          await pool.query('DELETE FROM topup_companies WHERE id = $1', [insertResult.rows[0].id]);
        }
      } catch (err2) {
        console.log('   ❌ Also failed with store_id = 1:', err2.message);
      }
    }

    // 4. List existing companies
    console.log('\n4️⃣  Existing companies in database:');
    const companies = await pool.query('SELECT id, store_id, name FROM topup_companies ORDER BY id DESC LIMIT 10');
    if (companies.rows.length === 0) {
      console.log('   (No companies found)');
    } else {
      companies.rows.forEach(comp => {
        console.log(`   • ID: ${comp.id}, Store: ${comp.store_id}, Name: ${comp.name}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 DIAGNOSIS COMPLETE\n');

  } catch (err) {
    console.error('\n❌ DIAGNOSTIC ERROR:', err.message);
    console.error('Details:', err);
  } finally {
    await pool.end();
  }
}

// Run the diagnostic
diagnoseCompanyError();

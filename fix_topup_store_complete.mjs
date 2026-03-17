import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@junction.proxy.rlwy.net:18175/railway',
  ssl: { rejectUnauthorized: false },
});

async function fixTopupStore() {
  try {
    console.log('\n🔧 COMPREHENSIVE TOPUP STORE FIX\n');
    console.log('='.repeat(60));

    // Step 1: Check for existing topup stores
    console.log('\n1️⃣  Checking for existing topup stores...');
    const topupStores = await pool.query(
      "SELECT id, store_name, store_type FROM stores WHERE store_type = 'topup' ORDER BY id"
    );
    
    if (topupStores.rows.length > 0) {
      console.log(`   ✅ Found ${topupStores.rows.length} topup store(s):`);
      topupStores.rows.forEach(s => {
        console.log(`      • ID: ${s.id}, Name: ${s.store_name}, Type: ${s.store_type}`);
      });
    } else {
      console.log('   ❌ No topup stores found, creating one...');
      
      // Find a suitable name
      const newStore = await pool.query(`
        INSERT INTO stores (store_name, slug, owner_name, owner_phone, category, status, is_active, store_type)
        VALUES ('متجر الشحن الرئيسي', 'topup-main', 'النظام', '+964', 'شحن', 'approved', true, 'topup')
        RETURNING id, store_name, store_type
      `);
      
      console.log(`   ✅ Created topup store: ID ${newStore.rows[0].id}`);
    }

    // Step 2: Check topup_companies table
    console.log('\n2️⃣  Checking topup_companies table...');
    const companiesCount = await pool.query(
      'SELECT COUNT(*) as count FROM topup_companies'
    );
    console.log(`   📊 Total companies: ${companiesCount.rows[0].count}`);
    
    if (companiesCount.rows[0].count === 0) {
      console.log('   ⚠️  No companies found, adding sample companies...');
      
      const firstTopupStore = topupStores.rows.length > 0 
        ? topupStores.rows[0].id 
        : (await pool.query("SELECT id FROM stores WHERE store_type = 'topup' LIMIT 1")).rows[0].id;
      
      const sampleCompanies = [
        'زين أثير',
        'آسيا سيل',
        'كورك',
        'اتصالات'
      ];
      
      for (const company of sampleCompanies) {
        await pool.query(
          'INSERT INTO topup_companies (store_id, name, is_active) VALUES ($1, $2, true) RETURNING id',
          [firstTopupStore, company]
        );
        console.log(`   ✅ Added company: ${company}`);
      }
    } else {
      console.log('   ✅ Companies already exist');
      const companies = await pool.query(
        'SELECT id, name, store_id FROM topup_companies LIMIT 10'
      );
      companies.rows.forEach(c => {
        console.log(`      • ID: ${c.id}, Name: ${c.name}, Store: ${c.store_id}`);
      });
    }

    // Step 3: Verify foreign key constraints
    console.log('\n3️⃣  Verifying foreign key constraints...');
    const fkCheck = await pool.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'topup_companies'
    `);
    
    if (fkCheck.rows.length > 0) {
      console.log('   ✅ Foreign key constraints found:');
      fkCheck.rows.forEach(fk => {
        console.log(`      • ${fk.constraint_name}: ${fk.table_name}.${fk.column_name}`);
      });
    }

    // Step 4: Test adding a new company
    console.log('\n4️⃣  Testing company insertion...');
    const testCompanyName = `Test Company ${new Date().getTime()}`;
    
    const topupStoreForTest = topupStores.rows.length > 0 
      ? topupStores.rows[0].id
      : (await pool.query("SELECT id FROM stores WHERE store_type = 'topup' LIMIT 1")).rows[0].id;
    
    try {
      const testInsert = await pool.query(
        'INSERT INTO topup_companies (store_id, name, is_active) VALUES ($1, $2, true) RETURNING *',
        [topupStoreForTest, testCompanyName]
      );
      
      console.log('   ✅ Test company added successfully!');
      console.log(`      • ID: ${testInsert.rows[0].id}`);
      console.log(`      • Name: ${testInsert.rows[0].name}`);
      console.log(`      • Store ID: ${testInsert.rows[0].store_id}`);
      
      // Delete test company
      await pool.query('DELETE FROM topup_companies WHERE id = $1', [testInsert.rows[0].id]);
      console.log('   🧹 Test company deleted');
    } catch (err) {
      console.error('   ❌ Test insert failed:');
      console.error(`      Error: ${err.message}`);
      console.error(`      Code: ${err.code}`);
      console.error(`      Detail: ${err.detail}`);
    }

    // Step 5: Summary
    console.log('\n5️⃣  Final Summary:');
    const finalStores = await pool.query("SELECT COUNT(*) as count FROM stores WHERE store_type = 'topup'");
    const finalCompanies = await pool.query('SELECT COUNT(*) as count FROM topup_companies');
    
    console.log(`   ✅ Topup stores: ${finalStores.rows[0].count}`);
    console.log(`   ✅ Companies: ${finalCompanies.rows[0].count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 FIX COMPLETE\n');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Details:', err);
  } finally {
    await pool.end();
  }
}

fixTopupStore();

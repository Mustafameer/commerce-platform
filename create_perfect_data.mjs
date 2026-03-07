import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function createPerfectData() {
  try {
    console.log('🧹 === CREATING PERFECT DATA FOR STORE 13 ===\n');

    // Step 1: Delete all current products
    console.log('🗑️  Deleting all current products...');
    await pool.query(`DELETE FROM topup_products WHERE store_id = 13`);
    console.log('✅ Deleted all products');

    // Step 2: Update company names to Arabic
    console.log('\n📝 Updating company names to Arabic...');
    const companies = [
      { store_id: 13, company_id: 1, old_name: 'Zain', new_name: 'زين' },
      { store_id: 13, company_id: 2, old_name: 'Asiacell', new_name: 'آسيا سيل' },
      { store_id: 13, company_id: 3, old_name: 'Ooredoo', new_name: 'أوريدو' },
      { store_id: 13, company_id: 4, old_name: 'HaloTel', new_name: 'هالو تل' }
    ];

    for (let comp of companies) {
      await pool.query(
        `UPDATE topup_companies SET name = $1 WHERE store_id = $2 AND id = $3`,
        [comp.new_name, comp.store_id, comp.company_id]
      );
      console.log(`   ✅ Updated: ${comp.old_name} → ${comp.new_name}`);
    }

    // Step 3: Add new products - 2 per category, all 5000 IQD
    console.log('\n📦 Adding 6 new products (2 per category × 5000 IQD)...\n');

    const products = [
      // Category 15: أملية
      { company_id: 1, category_id: 15, company_name: 'زين', cat_name: 'أملية', amount: 5000 },
      { company_id: 2, category_id: 15, company_name: 'آسيا سيل', cat_name: 'أملية', amount: 5000 },
      
      // Category 16: كوركس
      { company_id: 3, category_id: 16, company_name: 'أوريدو', cat_name: 'كوركس', amount: 5000 },
      { company_id: 4, category_id: 16, company_name: 'هالو تل', cat_name: 'كوركس', amount: 5000 },
      
      // Category 17: زين الاخر
      { company_id: 1, category_id: 17, company_name: 'زين', cat_name: 'زين الاخر', amount: 5000 },
      { company_id: 2, category_id: 17, company_name: 'آسيا سيل', cat_name: 'زين الاخر', amount: 5000 }
    ];

    let productCount = 1;
    for (let prod of products) {
      const price = 5200; // 5000 + 4% markup

      const result = await pool.query(
        `INSERT INTO topup_products 
         (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
         RETURNING id`,
        [13, prod.company_id, prod.category_id, prod.amount, price, price, 5100, 50]
      );

      console.log(`   [${productCount}] ${prod.company_name} > ${prod.cat_name} > ${prod.amount} IQD`);
      productCount++;
    }

    // Verify
    console.log('\n\n📊 === VERIFICATION ===\n');

    const categories = await pool.query(
      `SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id`
    );
    console.log('✅ Categories:');
    categories.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name}`);
    });

    const finalProducts = await pool.query(
      `SELECT 
        tp.id, tc.name as company_name, tpc.name as category_name, tp.amount, tp.price
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = 13
       ORDER BY tp.category_id, tp.company_id`
    );
    console.log(`\n✅ Products (${finalProducts.rows.length} total):`);
    finalProducts.rows.forEach(p => {
      console.log(`   [${p.id}] ${p.company_name} > ${p.category_name} > ${p.amount} IQD (السعر: ${p.price})`);
    });

    const companiesCheck = await pool.query(
      `SELECT id, name FROM topup_companies WHERE store_id = 13 ORDER BY id`
    );
    console.log(`\n✅ Companies (names are now Arabic):`);
    companiesCheck.rows.forEach(c => {
      console.log(`   ${c.name}`);
    });

    console.log('\n✅ DATA SETUP COMPLETE! All Arabic names, no English. 2 products per category × 5000 IQD each.');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

createPerfectData();

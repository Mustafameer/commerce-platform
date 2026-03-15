import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function initializeStore1() {
  try {
    console.log('🔧 Initializing store 1 with test products...');
    
    // Create SVG images
    const svg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+';
    const svg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxNDMyNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+';
    const svg3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZkYzIwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MTV4NTwvdGV4dD48L3N2Zz4=';
    
    // Check if store 1 exists
    const storeCheck = await pool.query('SELECT id FROM stores WHERE id = 1');
    if (storeCheck.rows.length === 0) {
      console.log('❌ Store 1 does not exist');
      await pool.end();
      return;
    }
    
    console.log('✅ Store 1 exists');
    
    // Delete old products
    const deleteResult = await pool.query('DELETE FROM topup_products WHERE store_id = 1');
    console.log(`🗑️  Deleted ${deleteResult.rowCount} old products`);
    
    // Get or create companies
    const companies = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = 1');
    
    let companyIds = {};
    if (companies.rows.length === 0) {
      console.log('📝 Creating companies for store 1...');
      const newCompanies = await pool.query(`
        INSERT INTO topup_companies (store_id, name, logo_url)
        VALUES 
          (1, 'زين أثير', 'https://via.placeholder.com/100'),
          (1, 'آسيا سيل', 'https://via.placeholder.com/100'),
          (1, 'كورك', 'https://via.placeholder.com/100')
        RETURNING id, name
      `);
      newCompanies.rows.forEach(c => {
        companyIds[c.name] = c.id;
        console.log(`   ✓ ${c.name} (ID: ${c.id})`);
      });
    } else {
      console.log(`📋 Found ${companies.rows.length} existing companies`);
      companies.rows.forEach(c => {
        companyIds[c.name] = c.id;
      });
    }
    
    // Add products
    console.log('📝 Adding products...');
    const products = await pool.query(`
      INSERT INTO topup_products (store_id, company_id, amount, price, retail_price, wholesale_price, images, is_active)
      VALUES 
        (1, $1, 35000, 40000, 38000, 37000, $2, true),
        (1, $3, 25000, 27500, 26500, 26000, $4, true),
        (1, $5, 15000, 17500, 16500, 16000, $6, true)
      RETURNING id, amount, price, array_length(images, 1) as images_count
    `, [
      companyIds['زين أثير'],
      [svg1, svg2, svg3, svg1, svg2],
      companyIds['آسيا سيل'],
      [svg3, svg1, svg2, svg3, svg1, svg2, svg3],
      companyIds['كورك'],
      [svg2, svg3, svg1, svg2, svg3]
    ]);
    
    console.log(`\n✅ Successfully added ${products.rows.length} products:\n`);
    products.rows.forEach(p => {
      console.log(`   🎁 ID: ${p.id}`);
      console.log(`      Amount: ${p.amount} دينار`);
      console.log(`      Price: ${p.price} د.ع`);
      console.log(`      Images: ${p.images_count} صور`);
      console.log('');
    });
    
    console.log('🎉 Store 1 initialization complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

initializeStore1();

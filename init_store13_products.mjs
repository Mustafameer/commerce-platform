import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function initializeStore13() {
  let connected = false;
  try {
    console.log('🔧 Initializing store 13 (علي_الهادي) with topup products...\n');
    
    // Create SVG placeholder images - UNIQUE for each product
    const svgImages = [
      // Zain products (أزرق/أحمر/أصفر)
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+WmFpbjwvdGV4dD48L3N2Zz4=',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI1JFRDAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjU8L3RleHQ+PC9zdmc+',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZGQzMwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzU8L3RleHQ+PC9zdmc+',
      // Asiacell products (أخضر/برتقالي/بنفسجي)
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzIySUI2MSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+QXNpYTwvdGV4dD48L3N2Zz4=',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZBNFM2MCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+NTA8L3RleHQ+PC9zdmc+',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzU5MkI2MCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MzA8L3RleHQ+PC9zdmc+',
      // Korek products (زهري/بني/أحمر)
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UzNzE4QiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+S29yZWs8L3RleHQ+PC9zdmc+',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzhCNDUxMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+NDU8L3RleHQ+PC9zdmc+',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0QzMjEyOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXdlaWdodD0iYm9sZCI+MjA8L3RleHQ+PC9zdmc+'
    ];
    
    connected = true;
    
    // Check if store 13 exists
    const storeCheck = await pool.query('SELECT id, store_name FROM stores WHERE id = 13');
    if (storeCheck.rows.length === 0) {
      console.log('❌ Store 13 does not exist\n');
      return;
    }
    
    console.log(`✅ Store 13 exists: ${storeCheck.rows[0].store_name}\n`);
    
    // Get company IDs for store 13
    console.log('📝 Getting company IDs...\n');
    const companies = await pool.query(
      'SELECT id, name FROM topup_companies WHERE store_id = 13 ORDER BY id'
    );
    
    if (companies.rows.length === 0) {
      console.log('❌ No companies found for store 13');
      return;
    }
    
    console.log(`✅ Found ${companies.rows.length} companies:\n`);
    const companyMap = {};
    companies.rows.forEach(c => {
      companyMap[c.name] = c.id;
      console.log(`   • ${c.name} (ID: ${c.id})`);
    });
    console.log('');
    
    // Add products for each company
    console.log('📝 Adding products...\n');
    
    // Use tariff (توب أب) category ID 25
    const categoryId = 25;
    
    // Company 1: زين أثير - 3 products
    const products1 = await pool.query(`
      INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, images, is_active)
      VALUES 
        (13, $1, $2, 35000, 40000, 38000, 37000, $3, true),
        (13, $1, $2, 25000, 27500, 26500, 26000, $4, true),
        (13, $1, $2, 15000, 17500, 16500, 16000, $5, true)
      RETURNING id, amount, price, array_length(images, 1) as images_count
    `, [companyMap['زين اثير'], categoryId, [svgImages[0]], [svgImages[1]], [svgImages[2]]]);
    
    // Company 2: آسيا سيل - 3 products
    const products2 = await pool.query(`
      INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, images, is_active)
      VALUES 
        (13, $1, $2, 50000, 55000, 52500, 51000, $3, true),
        (13, $1, $2, 30000, 33000, 31500, 30500, $4, true),
        (13, $1, $2, 10000, 11000, 10500, 10200, $5, true)
      RETURNING id, amount, price, array_length(images, 1) as images_count
    `, [companyMap['آسيا سيل'], categoryId, [svgImages[3]], [svgImages[4]], [svgImages[5]]]);
    
    // Company 3: كورك - 3 products
    const products3 = await pool.query(`
      INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, images, is_active)
      VALUES 
        (13, $1, $2, 20000, 22000, 21000, 20500, $3, true),
        (13, $1, $2, 45000, 50000, 47500, 46000, $4, true),
        (13, $1, $2, 5000, 5500, 5250, 5150, $5, true)
      RETURNING id, amount, price, array_length(images, 1) as images_count
    `, [companyMap['كورك'], categoryId, [svgImages[6]], [svgImages[7]], [svgImages[8]]]);
    
    const allProducts = [...products1.rows, ...products2.rows, ...products3.rows];
    
    console.log(`✅ Successfully added ${allProducts.length} products:\n`);
    
    const companyNames = ['زين اثير', 'آسيا سيل', 'كورك'];
    let idx = 0;
    
    for (const company of companyNames) {
      console.log(`🏢 ${company}:`);
      for (let i = 0; i < 3; i++) {
        const p = allProducts[idx++];
        console.log(`   🎁 ID: ${p.id} | ${p.amount} دينار | ${p.price} د.ع | ${p.images_count} صور`);
      }
      console.log('');
    }
    
    console.log('🎉 Store 13 initialization complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    if (connected) {
      try {
        await pool.end();
      } catch (e) {
        // ignore
      }
    }
  }
}

initializeStore13();

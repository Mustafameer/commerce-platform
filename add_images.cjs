const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function addImages() {
  try {
    // SVG images for different companies
    const zainSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23FF3333%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2280%22 font-weight=%22bold%22 fill=%22white%22%3EZain%3C/text%3E%3C/svg%3E';
    const asiaSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%2300AA66%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2260%22 font-weight=%22bold%22 fill=%22white%22%3EAsia%3C/text%3E%3C/svg%3E';
    const corkSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%225500CC%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2280%22 font-weight=%22bold%22 fill=%22white%22%3ECork%3C/text%3E%3C/svg%3E';

    // Update products with images
    const products = [
      { id: 88, company_id: 1, svg: zainSvg },
      { id: 91, company_id: 1, svg: zainSvg },
      { id: 92, company_id: 2, svg: asiaSvg },
      { id: 95, company_id: 2, svg: asiaSvg },
      { id: 90, company_id: 3, svg: corkSvg },
      { id: 89, company_id: 3, svg: corkSvg },
      { id: 93, company_id: 1, svg: zainSvg }
    ];

    let updated = 0;
    for (const product of products) {
      await pool.query('UPDATE topup_products SET images = ARRAY[$1] WHERE id = $2', [product.svg, product.id]);
      updated++;
    }

    console.log(`✅ Updated ${updated} products with images`);
    pool.end();
  } catch(e) { 
    console.error('ERROR:', e.message); 
    pool.end(); 
  }
}

addImages();

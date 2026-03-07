const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkCodes() {
  try {
    const result = await pool.query(`
      SELECT id, name, array_length(codes, 1) as codes_count, codes FROM topup_products LIMIT 3
    `);
    console.log('Topup Products:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}`);
      console.log(`  Codes Type: ${typeof row.codes}`);
      console.log(`  Codes Count: ${row.codes_count}`);
      if (row.codes) {
        if (typeof row.codes === 'string') {
          console.log(`  Is String: YES`);
          console.log(`  String Length: ${row.codes.length}`);
          try {
            const parsed = JSON.parse(row.codes);
            console.log(`  JSON Parse Success: YES`);
            console.log(`  Array Length: ${Array.isArray(parsed) ? parsed.length : 'NOT ARRAY'}`);
          } catch (e) {
            console.log(`  JSON Parse Success: NO - ${e.message}`);
          }
        } else if (Array.isArray(row.codes)) {
          console.log(`  Is Array: YES`);
          console.log(`  Array Length: ${row.codes.length}`);
          console.log(`  First 3: ${JSON.stringify(row.codes.slice(0, 3))}`);
        } else {
          console.log(`  Type: ${typeof row.codes}`);
          console.log(`  Value: ${JSON.stringify(row.codes)}`);
        }
      }
      console.log('---');
    });
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkCodes();

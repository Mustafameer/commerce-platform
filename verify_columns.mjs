import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost/multi_ecommerce'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'auctions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🔍 AUCTIONS TABLE COLUMNS:\n');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name.padEnd(25)} ${row.data_type.padEnd(15)} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n\n🛍️ PRODUCTS TABLE COLUMNS:\n');
    const prodResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    prodResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name.padEnd(25)} ${row.data_type.padEnd(15)} (nullable: ${row.is_nullable})`);
    });

    // Check sample data
    console.log('\n\n📊 SAMPLE AUCTION RECORD:\n');
    const sampleResult = await pool.query(`SELECT * FROM auctions LIMIT 1`);
    if (sampleResult.rows.length > 0) {
      const auction = sampleResult.rows[0];
      Object.entries(auction).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } else {
      console.log('  (No auctions found)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();

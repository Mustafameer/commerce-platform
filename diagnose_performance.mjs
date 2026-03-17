import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function diagnosePerformance() {
  try {
    console.log('\n🔍 PERFORMANCE DIAGNOSIS\n');
    console.log('═══════════════════════════════════════\n');

    // 1. Database Statistics
    console.log('📊 Database Statistics:\n');
    
    const tables = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) as columns
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 15
    `);

    console.log('Top Tables by Size:\n');
    tables.rows.forEach((t, i) => {
      console.log(`${i + 1}. ${t.tablename.padEnd(25)} | ${t.size.padEnd(10)} | ${t.columns} cols`);
    });

    // 2. Row Counts
    console.log('\n\n📈 Row Counts:\n');
    
    const counts = await pool.query(`
      SELECT 
        'stores' as table_name,
        COUNT(*) as count
      FROM stores
      UNION ALL
      SELECT 'users' as table_name, COUNT(*) FROM users
      UNION ALL
      SELECT 'customers' as table_name, COUNT(*) FROM customers
      UNION ALL
      SELECT 'orders' as table_name, COUNT(*) FROM orders
      UNION ALL
      SELECT 'topup_products' as table_name, COUNT(*) FROM topup_products
      UNION ALL
      SELECT 'topup_product_images' as table_name, COUNT(*) FROM topup_product_images
      UNION ALL
      SELECT 'products' as table_name, COUNT(*) FROM products
      ORDER BY table_name
    `);

    counts.rows.forEach(row => {
      console.log(`   ${row.table_name.padEnd(25)} : ${row.count.toString().padStart(5)} rows`);
    });

    // 3. Index Status
    console.log('\n\n🔑 Index Status:\n');
    
    const indexes = await pool.query(`
      SELECT
        indexname,
        tablename,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_indexes 
      WHERE schemaname = 'public'
      LIMIT 10
    `);

    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`   ${idx.indexname.padEnd(35)} on ${idx.tablename.padEnd(20)} | ${idx.size}`);
      });
    } else {
      console.log('   ⚠️  No indexes found!');
    }

    // 4. Query Performance
    console.log('\n\n⚡ Query Performance Test:\n');

    // Test 1: Store 13
    const start1 = Date.now();
    await pool.query('SELECT * FROM stores WHERE id = 13');
    const time1 = Date.now() - start1;
    console.log(`   Store lookup (id=13): ${time1}ms`);

    // Test 2: Topup products
    const start2 = Date.now();
    await pool.query('SELECT * FROM topup_products WHERE store_id = 13');
    const time2 = Date.now() - start2;
    console.log(`   Topup products (store 13): ${time2}ms`);

    // Test 3: Images
    const start3 = Date.now();
    await pool.query('SELECT * FROM topup_product_images');
    const time3 = Date.now() - start3;
    console.log(`   All images: ${time3}ms`);

    // Test 4: Join query
    const start4 = Date.now();
    await pool.query(`
      SELECT tp.*, tpi.image_data, tc.name 
      FROM topup_products tp
      LEFT JOIN topup_product_images tpi ON tp.id = tpi.topup_product_id
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      WHERE tp.store_id = 13
    `);
    const time4 = Date.now() - start4;
    console.log(`   Complex join query: ${time4}ms`);

    // 5. Recommendations
    console.log('\n\n💡 Recommendations:\n');

    if (indexes.rows.length < 5) {
      console.log('   ⚠️  Add more indexes for better performance');
    }

    const totalTime = time1 + time2 + time3 + time4;
    if (totalTime > 100) {
      console.log('   ⚠️  Consider optimizing queries');
    } else {
      console.log('   ✅ Query performance is good');
    }

    const totalRows = counts.rows.reduce((sum, r) => sum + r.count, 0);
    console.log(`   📊 Total rows in database: ${totalRows}`);

    // 6. Potential Issues
    console.log('\n\n🚨 Potential Issues:\n');

    const slowQuery = Math.max(time1, time2, time3, time4);
    if (slowQuery > 50) {
      console.log(`   ⚠️  Query taking ${slowQuery}ms (slow for local)`);
      console.log('      → Add indexes to foreign key columns');
      console.log('      → Check for missing LIMIT clauses');
    } else {
      console.log('   ✅ No slow queries detected');
    }

    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosePerformance();

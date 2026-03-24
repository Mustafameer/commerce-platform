// Cleanup orphaned auctions and fix foreign key constraints
import pkg from 'pg';
const { Client } = pkg;

// Cloud only - require DATABASE_URL to be set
if (!process.env.DATABASE_URL) {
  console.error('❌ [FATAL] DATABASE_URL environment variable not set.');
  console.error('   Cannot proceed with database operations.');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
console.log('🔌 Connecting to cloud database...');

const client = new Client({
  connectionString
});

async function cleanup() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check current counts
    console.log('📊 Current database state:');
    const productsRes = await client.query('SELECT COUNT(*) as count FROM products');
    const auctionsRes = await client.query('SELECT COUNT(*) as count FROM auctions');
    
    const productCount = productsRes.rows[0].count;
    const auctionCount = auctionsRes.rows[0].count;
    
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Auctions: ${auctionCount}\n`);

    // Step 2: Find orphaned auctions
    console.log('🔍 Finding orphaned auctions (auctions with missing products)...');
    const orphanedRes = await client.query(`
      SELECT a.id, a.product_id FROM auctions a
      LEFT JOIN products p ON a.product_id = p.id
      WHERE p.id IS NULL
    `);

    const orphanedCount = orphanedRes.rows.length;
    console.log(`   - Found ${orphanedCount} orphaned auctions\n`);

    if (orphanedCount > 0) {
      console.log('   Orphaned auction IDs:', orphanedRes.rows.map(r => r.id).join(', '));
    }

    // Step 3: Delete orphaned auctions
    if (orphanedCount > 0) {
      console.log(`\n🗑️ Deleting ${orphanedCount} orphaned auctions...`);
      const orphanIds = orphanedRes.rows.map(r => r.id);
      
      const deleteRes = await client.query(
        `DELETE FROM auctions WHERE id = ANY($1)`,
        [orphanIds]
      );
      
      console.log(`   ✅ Deleted ${deleteRes.rowCount} orphaned records\n`);
    }

    // Step 4: Add foreign key constraint if it doesn't exist
    console.log('🔐 Checking foreign key constraints...');
    const constraintRes = await client.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name='auctions' AND constraint_type='FOREIGN KEY'
    `);

    if (constraintRes.rows.length === 0) {
      console.log('   ⚠️ No foreign key found - adding cascade delete constraint...');
      try {
        await client.query(`
          ALTER TABLE auctions
          ADD CONSTRAINT auctions_product_id_fkey
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        `);
        console.log('   ✅ Foreign key constraint added with ON DELETE CASCADE\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('   ℹ️ Foreign key already exists\n');
        } else {
          throw err;
        }
      }
    } else {
      console.log(`   ✅ Foreign key exists: ${constraintRes.rows[0].constraint_name}\n`);
    }

    // Step 5: Final counts
    console.log('📊 Final database state:');
    const finalProductsRes = await client.query('SELECT COUNT(*) as count FROM products');
    const finalAuctionsRes = await client.query('SELECT COUNT(*) as count FROM auctions');
    
    const finalProductCount = finalProductsRes.rows[0].count;
    const finalAuctionCount = finalAuctionsRes.rows[0].count;
    
    console.log(`   - Products: ${finalProductCount}`);
    console.log(`   - Auctions: ${finalAuctionCount}\n`);

    if (orphanedCount > 0) {
      console.log('═══════════════════════════════════════════════');
      console.log('✅ CLEANUP COMPLETE');
      console.log('═══════════════════════════════════════════════');
      console.log(`Removed ${orphanedCount} orphaned auction records`);
      console.log(`Database is now clean and consistent ✓`);
    } else {
      console.log('✅ No orphaned records found - database is clean!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

cleanup();

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function fixStoreIds() {
  try {
    console.log("🔍 Fetching stores and their owners...");
    const storesResult = await pool.query(`
      SELECT id, owner_id, store_name FROM stores
    `);
    
    console.log(`Found ${storesResult.rows.length} stores`);
    
    for (const store of storesResult.rows) {
      console.log(`\n📍 Processing store: "${store.store_name}" (ID: ${store.id}, Owner ID: ${store.owner_id})`);
      
      // Update user's store_id
      const updateResult = await pool.query(
        `UPDATE users SET store_id = $1 WHERE id = $2 AND role = 'merchant'`,
        [store.id, store.owner_id]
      );
      
      console.log(`   ✅ Updated ${updateResult.rowCount} user(s)`);
    }
    
    console.log("\n🔄 Verifying merchants now have store_id...");
    const verifyResult = await pool.query(`
      SELECT name, phone, store_id FROM users WHERE role = 'merchant' LIMIT 5
    `);
    
    verifyResult.rows.forEach(row => {
      console.log(`   • ${row.name} (${row.phone}): store_id = ${row.store_id}`);
    });
    
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixStoreIds();

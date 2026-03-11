import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

(async () => {
  try {
    // Get ALL stores regardless of status
    const stores = await pool.query('SELECT * FROM stores ORDER BY id DESC');
    console.log('📋 ALL STORES:');
    console.log('Total rows in stores table: ' + stores.rows.length);
    
    stores.rows.forEach((s, i) => {
      console.log(`\n${i+1}. ID: ${s.id}`);
      console.log(`   Name: ${s.store_name}`);
      console.log(`   Status: ${s.status}`);
      console.log(`   is_active: ${s.is_active}`);
      console.log(`   Owner: ${s.owner_name}`);
    });
    
    // List all columns in the table
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='stores'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Store table columns:');
    columns.rows.forEach(c => console.log(`  - ${c.column_name}`));
    
    // Check if there's a deleted_at or is_deleted field
    const hasDeletedAt = columns.rows.some(c => c.column_name === 'deleted_at');
    const hasIsDeleted = columns.rows.some(c => c.column_name === 'is_deleted');
    
    if (hasDeletedAt || hasIsDeleted) {
      console.log('\n⚠️ Found soft-delete column! Checking for deleted records...');
      if (hasDeletedAt) {
        const deleted = await pool.query('SELECT COUNT(*) as count FROM stores WHERE deleted_at IS NOT NULL');
        console.log(`  Soft-deleted stores: ${deleted.rows[0].count}`);
      }
      if (hasIsDeleted) {
        const deleted = await pool.query('SELECT COUNT(*) as count FROM stores WHERE is_deleted = true');
        console.log(`  Marked as deleted: ${deleted.rows[0].count}`);
      }
    }
    
    await pool.end();
  } catch(e) { 
    console.error('Error:', e.message);
  }
})();

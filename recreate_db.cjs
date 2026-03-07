const { Pool } = require('pg');

const poolRoot = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '123'
});

async function recreateDb() {
  try {
    // Terminate all connections to the target database
    await poolRoot.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'multi_ecommerce'
      AND pid <> pg_backend_pid();
    `);
    console.log('✅ Terminated connections to multi_ecommerce');

    // Drop the database
    await poolRoot.query('DROP DATABASE IF EXISTS multi_ecommerce');
    console.log('✅ Dropped database multi_ecommerce');

    // Recreate the database
    await poolRoot.query('CREATE DATABASE multi_ecommerce');
    console.log('✅ Created new database multi_ecommerce');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await poolRoot.end();
  }
}

recreateDb();

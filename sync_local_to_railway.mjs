import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

// Local database
const localPool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

// Railway database - try multiple connection string options
const getRailwayPool = () => {
  let connectionString = process.env.RAILWAY_DATABASE_URL;
  
  if (!connectionString) {
    // Try Railway's public database proxy URL
    // Format: postgresql://username:password@gateway.railway.app:port/database
    connectionString = "postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@junction.proxy.rlwy.net:35359/railway";
  }
  
  console.log(`Using Railway connection: ${connectionString.substring(0, 50)}...`);
  
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connect_timeout: 15000,
    connectionTimeoutMillis: 15000
  });
};

async function getAllTableSchemas(client) {
  console.log('📋 Fetching table schemas...\n');
  
  const tablesResult = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `);
  
  const schemas = {};
  
  for (const row of tablesResult.rows) {
    const tableName = row.table_name;
    
    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name='${tableName}'
      ORDER BY ordinal_position
    `);
    
    schemas[tableName] = columnsResult.rows;
  }
  
  return schemas;
}

async function recreateTablesOnRailway(railwayClient, schemas) {
  console.log('🔨 Recreating tables on Railway...\n');
  
  for (const [tableName, columns] of Object.entries(schemas)) {
    console.log(`📦 Creating table: ${tableName}`);
    
    let createQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    createQuery += columns.map(col => {
      let colDef = `  "${col.column_name}" ${col.data_type}`;
      if (col.is_nullable === 'NO') colDef += ' NOT NULL';
      if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
      return colDef;
    }).join(',\n');
    createQuery += '\n)';
    
    try {
      await railwayClient.query(createQuery);
      console.log(`   ✅ Created table: ${tableName}`);
    } catch (error) {
      console.log(`   ⚠️  Table may already exist: ${tableName}`);
    }
  }
}

async function backupAndRestore() {
  let localClient, railwayClient;
  
  try {
    console.log('🚀 Starting database sync: Local → Railway\n');
    
    // Connect to local database
    console.log('🔌 Connecting to local database...');
    localClient = await localPool.connect();
    console.log('✅ Connected to local database\n');
    
    // Get all table schemas
    const schemas = await getAllTableSchemas(localClient);
    const tableNames = Object.keys(schemas);
    
    console.log(`✅ Found ${tableNames.length} tables\n`);
    
    // Connect to Railway database
    console.log('🔌 Connecting to Railway database...');
    const railwayPool = getRailwayPool();
    railwayClient = await railwayPool.connect();
    console.log('✅ Connected to Railway database\n');
    
    // Drop all existing tables on Railway
    console.log('🗑️  Clearing Railway database...\n');
    for (const tableName of tableNames.reverse()) {
      try {
        await railwayClient.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`   ✅ Dropped: ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${tableName}`);
      }
    }
    
    // Recreate tables on Railway
    await recreateTablesOnRailway(railwayClient, schemas);
    
    // Copy data from local to Railway
    console.log('\n📥 Copying data to Railway...\n');
    for (const tableName of tableNames) {
      const result = await localClient.query(`SELECT * FROM "${tableName}"`);
      const rows = result.rows;
      
      if (rows.length === 0) {
        console.log(`⏭️  ${tableName}: (empty)`);
        continue;
      }
      
      console.log(`📥 ${tableName}: ${rows.length} rows`);
      
      const columns = Object.keys(rows[0]);
      let insertedCount = 0;
      
      for (const row of rows) {
        const columnList = columns.map(col => `"${col}"`).join(', ');
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        }).join(', ');
        
        try {
          await railwayClient.query(`INSERT INTO "${tableName}" (${columnList}) VALUES (${values})`);
          insertedCount++;
        } catch (error) {
          console.log(`      ⚠️  Error inserting row: ${error.message.substring(0, 50)}`);
        }
      }
      
      console.log(`   ✅ Inserted ${insertedCount}/${rows.length} rows`);
    }
    
    console.log('\n✅ Database sync completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (localClient) localClient.release();
    if (railwayClient) railwayClient.release();
    await localPool.end();
  }
}

backupAndRestore();


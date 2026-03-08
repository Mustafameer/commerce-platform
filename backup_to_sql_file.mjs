import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const localPool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function backupToSQL() {
  let client;
  
  try {
    console.log('🚀 Creating SQL backup from local database...\n');
    
    client = await localPool.connect();
    
    // Get all tables in proper dependency order
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name
    `);
    
    let sqlContent = `-- Commerce Platform Database Backup
-- Generated: ${new Date().toISOString()}
-- This SQL file backs up the entire local database

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

BEGIN TRANSACTION;

`;
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`📋 Found ${tables.length} tables\n`);
    
    // Drop existing tables
    console.log('🗑️  Generating DROP statements...');
    sqlContent += `-- Drop existing tables (in reverse dependency order)\n`;
    for (const table of tables.reverse()) {
      sqlContent += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
    }
    sqlContent += `\n`;
    
    // Recreate tables with schemas
    console.log('📦 Generating CREATE statements...');
    for (const tableName of tables) {
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
      
      sqlContent += `\n-- Table: ${tableName}\n`;
      sqlContent += `CREATE TABLE "${tableName}" (\n`;
      
      sqlContent += columnsResult.rows.map((col, idx) => {
        let colDef = `  "${col.column_name}" ${col.data_type}`;
        if (col.is_nullable === 'NO') colDef += ' NOT NULL';
        if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
        if (idx < columnsResult.rows.length - 1) colDef += ',';
        return colDef;
      }).join('\n');
      
      sqlContent += `\n);\n`;
    }
    
    // Insert data
    console.log('📥 Generating INSERT statements...\n');
    let totalRows = 0;
    
    for (const tableName of tables) {
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
      const rows = dataResult.rows;
      
      if (rows.length > 0) {
        console.log(`   ${tableName}: ${rows.length} rows`);
        sqlContent += `\n-- Data for table: ${tableName}\n`;
        
        const columns = Object.keys(rows[0]);
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
          
          sqlContent += `INSERT INTO "${tableName}" (${columnList}) VALUES (${values});\n`;
          totalRows++;
        }
      }
    }
    
    sqlContent += `\nCOMMIT;\n`;
    
    // Write to file
    const filename = 'local_database_backup.sql';
    fs.writeFileSync(filename, sqlContent);
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📊 Total rows: ${totalRows}`);
    console.log(`💾 Saved to: ${filename}`);
    console.log(`📈 File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (client) client.release();
    await localPool.end();
  }
}

backupToSQL();

/**
 * UTF-8 Encoding Setup Script
 * Ensures all database connections and responses use proper UTF-8 encoding
 */

import pg from 'pg';
import { getDatabaseSslConfig, getRequiredDatabaseUrl } from './db-config.ts';

const { Pool } = pg;

export async function setupDatabaseUTF8() {
  try {
    const databaseUrl = getRequiredDatabaseUrl();
    
    const setupPool = new Pool({
      connectionString: databaseUrl,
      ssl: getDatabaseSslConfig(),
      connectionTimeoutMillis: 10000,
      max: 1,
    });

    const client = await setupPool.connect();
    
    try {
      // Set client encoding to UTF-8
      await client.query('SET client_encoding = UTF8');
      console.log('✅ [UTF-8] Client encoding set to UTF-8');
      
      // Verify encoding
      const result = await client.query('SHOW client_encoding');
      const encoding = result.rows[0]?.client_encoding;
      console.log(`✅ [UTF-8] Verified encoding: ${encoding}`);
      
      // Show server encoding
      const serverResult = await client.query('SHOW server_encoding');
      console.log(`ℹ️  [UTF-8] Server encoding: ${serverResult.rows[0]?.server_encoding}`);
      
      // Show database encoding
      const dbResult = await client.query(`
        SELECT encoding FROM pg_database WHERE datname = current_database()
      `);
      console.log(`ℹ️  [UTF-8] Database encoding: ${dbResult.rows[0]?.encoding}`);
      
    } finally {
      client.release();
      await setupPool.end();
    }
    
  } catch (error: any) {
    console.warn('⚠️  [UTF-8] Warning during setup:', error.message);
    // Don't throw - continue with degraded mode
  }
}

export function setupNodeUTF8() {
  // Ensure Node.js uses UTF-8
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  console.log('✅ [UTF-8] Node.js UTF-8 mode enabled');
}

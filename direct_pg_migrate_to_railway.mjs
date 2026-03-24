import pg from 'pg';

const { Pool } = pg;

const LOCAL_DB = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
const RAILWAY_DB = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@gondola.proxy.rlwy.net:42495/railway';

const localPool = new Pool({
  connectionString: LOCAL_DB,
  connectionTimeoutMillis: 10000,
});

const railwayPool = new Pool({
  connectionString: RAILWAY_DB,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'cyan') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function getSequenceNameFromDefault(defaultValue) {
  if (!defaultValue) {
    return null;
  }
  const match = defaultValue.match(/nextval\('([^']+)'::regclass\)/);
  return match ? match[1] : null;
}

async function sql(client, text, params = []) {
  return client.query(text, params);
}

async function getTables(client) {
  const result = await sql(
    client,
    `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `,
  );
  return result.rows.map((row) => row.tablename);
}

async function getColumns(client, tableName) {
  const result = await sql(
    client,
    `
      SELECT
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS formatted_type,
        NOT a.attnotnull AS is_nullable,
        pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
        a.attnum AS ordinal_position
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
      WHERE n.nspname = 'public'
        AND c.relname = $1
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `,
    [tableName],
  );
  return result.rows;
}

async function getConstraints(client, tableName, types) {
  const result = await sql(
    client,
    `
      SELECT conname, contype, pg_get_constraintdef(oid, true) AS definition
      FROM pg_constraint
      WHERE conrelid = $1::regclass
        AND contype = ANY($2::char[])
      ORDER BY conname
    `,
    [`public.${tableName}`, types],
  );
  return result.rows;
}

async function getIndexes(client, tableName) {
  const result = await sql(
    client,
    `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1
        AND indexname NOT IN (
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = $2::regclass
        )
      ORDER BY indexname
    `,
    [tableName, `public.${tableName}`],
  );
  return result.rows;
}

async function resetRemoteSchema(client) {
  log('\n[1/6] Dropping existing Railway public schema...', 'yellow');
  await sql(client, 'DROP SCHEMA IF EXISTS public CASCADE');
  await sql(client, 'CREATE SCHEMA public');
  await sql(client, 'GRANT ALL ON SCHEMA public TO postgres');
  await sql(client, 'GRANT ALL ON SCHEMA public TO public');
}

async function createSequences(client, columns) {
  const created = new Set();
  for (const column of columns) {
    const sequenceName = getSequenceNameFromDefault(column.column_default);
    if (!sequenceName || created.has(sequenceName)) {
      continue;
    }
    const quotedSequence = sequenceName.split('.').map(quoteIdent).join('.');
    await sql(client, `CREATE SEQUENCE IF NOT EXISTS ${quotedSequence}`);
    created.add(sequenceName);
  }
}

async function createTable(client, tableName, columns) {
  await createSequences(client, columns);

  const defs = columns.map((column) => {
    let def = `${quoteIdent(column.column_name)} ${column.formatted_type}`;
    if (!column.is_nullable) {
      def += ' NOT NULL';
    }
    return def;
  });

  await sql(client, `CREATE TABLE ${quoteIdent(tableName)} (${defs.join(', ')})`);
}

async function applyDefaults(client, tableName, columns) {
  for (const column of columns) {
    if (!column.column_default) {
      continue;
    }

    try {
      await sql(
        client,
        `ALTER TABLE ${quoteIdent(tableName)} ALTER COLUMN ${quoteIdent(column.column_name)} SET DEFAULT ${column.column_default}`,
      );
    } catch (error) {
      log(`  - default skipped for ${tableName}.${column.column_name}: ${error.message}`, 'yellow');
    }
  }
}

async function copyRows(localClient, remoteClient, tableName, columns) {
  const columnNames = columns.map((column) => column.column_name);
  const selectStatement = `SELECT * FROM ${quoteIdent(tableName)}`;
  const result = await sql(localClient, selectStatement);
  const rows = result.rows;

  if (rows.length === 0) {
    log(`  - ${tableName}: 0 rows`, 'cyan');
    return 0;
  }

  const placeholders = columnNames.map((_, index) => `$${index + 1}`).join(', ');
  const insertStatement = `INSERT INTO ${quoteIdent(tableName)} (${columnNames.map(quoteIdent).join(', ')}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = columnNames.map((name) => row[name]);
    await sql(remoteClient, insertStatement, values);
  }

  log(`  - ${tableName}: ${rows.length} rows copied`, 'green');
  return rows.length;
}

async function applyConstraints(client, tableName, constraints) {
  for (const constraint of constraints) {
    await sql(
      client,
      `ALTER TABLE ${quoteIdent(tableName)} ADD CONSTRAINT ${quoteIdent(constraint.conname)} ${constraint.definition}`,
    );
  }
}

async function applyIndexes(client, indexes) {
  for (const index of indexes) {
    await sql(client, index.indexdef);
  }
}

async function syncSequences(client, tableName, columns) {
  for (const column of columns) {
    const sequenceName = getSequenceNameFromDefault(column.column_default);
    if (!sequenceName) {
      continue;
    }

    const result = await sql(
      client,
      `SELECT COALESCE(MAX(${quoteIdent(column.column_name)}), 0) AS max_id FROM ${quoteIdent(tableName)}`,
    );
    const maxId = Number(result.rows[0].max_id || 0);
    await sql(client, 'SELECT setval($1::regclass, $2, true)', [sequenceName, maxId > 0 ? maxId : 1]);
  }
}

async function verify(localClient, remoteClient, tables) {
  log('\n[6/6] Verifying migrated data...', 'yellow');

  for (const tableName of tables) {
    const localCount = Number((await sql(localClient, `SELECT COUNT(*) AS count FROM ${quoteIdent(tableName)}`)).rows[0].count);
    const remoteCount = Number((await sql(remoteClient, `SELECT COUNT(*) AS count FROM ${quoteIdent(tableName)}`)).rows[0].count);

    if (localCount !== remoteCount) {
      throw new Error(`Verification mismatch on ${tableName}: local=${localCount}, railway=${remoteCount}`);
    }

    log(`  - ${tableName}: ${localCount} rows verified`, 'green');
  }
}

async function main() {
  let totalRows = 0;

  try {
    log('[0/6] Checking local and Railway connections...', 'yellow');
    await sql(localPool, 'SELECT 1');
    await sql(railwayPool, 'SELECT 1');
    log('  - Local PostgreSQL connected', 'green');
    log('  - Railway PostgreSQL connected', 'green');

    const tables = await getTables(localPool);
    if (tables.length === 0) {
      throw new Error('No tables found in local public schema');
    }

    await resetRemoteSchema(railwayPool);

    log('\n[2/6] Creating tables and copying data...', 'yellow');
    for (const tableName of tables) {
      const columns = await getColumns(localPool, tableName);
      await createTable(railwayPool, tableName, columns);
      totalRows += await copyRows(localPool, railwayPool, tableName, columns);
    }

    log('\n[3/6] Applying primary, unique, and check constraints...', 'yellow');
    for (const tableName of tables) {
      const columns = await getColumns(localPool, tableName);
      await applyDefaults(railwayPool, tableName, columns);
      const constraints = await getConstraints(localPool, tableName, ['p', 'u', 'c']);
      await applyConstraints(railwayPool, tableName, constraints);
    }

    log('\n[4/6] Applying foreign keys...', 'yellow');
    for (const tableName of tables) {
      const constraints = await getConstraints(localPool, tableName, ['f']);
      await applyConstraints(railwayPool, tableName, constraints);
    }

    log('\n[5/6] Applying indexes and syncing sequences...', 'yellow');
    for (const tableName of tables) {
      const indexes = await getIndexes(localPool, tableName);
      const columns = await getColumns(localPool, tableName);
      await applyIndexes(railwayPool, indexes);
      await syncSequences(railwayPool, tableName, columns);
    }

    await verify(localPool, railwayPool, tables);

    log(`\nMigration completed successfully. ${tables.length} tables and ${totalRows} rows copied.`, 'green');
  } catch (error) {
    log(`\nMigration failed: ${error.message}`, 'red');
    process.exitCode = 1;
  } finally {
    await localPool.end();
    await railwayPool.end();
  }
}

main();

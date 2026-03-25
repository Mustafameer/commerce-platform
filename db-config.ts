const DEFAULT_CLOUD_APP_URL = 'https://web-production-9efff.up.railway.app';

const FORBIDDEN_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function getRequiredDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('[DB] DATABASE_URL is required and must point to the cloud database.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('[DB] DATABASE_URL is invalid.');
  }

  if (FORBIDDEN_DB_HOSTS.has(parsedUrl.hostname)) {
    throw new Error(`[DB] Local database hosts are forbidden: ${parsedUrl.hostname}`);
  }

  return databaseUrl;
}

export function getDatabaseSslConfig() {
  return { rejectUnauthorized: false };
}

export function getAppOrigin(): string {
  const configuredOrigin = process.env.APP_URL?.trim() || process.env.VITE_API_URL?.trim() || DEFAULT_CLOUD_APP_URL;

  try {
    const parsedUrl = new URL(configuredOrigin);
    if (FORBIDDEN_DB_HOSTS.has(parsedUrl.hostname)) {
      return DEFAULT_CLOUD_APP_URL;
    }
    return parsedUrl.origin;
  } catch {
    return DEFAULT_CLOUD_APP_URL;
  }
}
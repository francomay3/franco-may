import { Pool } from 'pg';

/**
 * One pool per server instance, reused across requests.
 *
 * On a serverless platform each cold start would otherwise open its own
 * connections and never close them, and Postgres runs out of connections long
 * before it runs out of anything else. The global is what survives the
 * module reload that hot reloading and lambda reuse both do.
 *
 * DATABASE_URL must be a POOLED connection string (Neon's `-pooler` host, or
 * Supabase's port 6543). A direct connection works in development and falls
 * over in production for the reason above.
 */
const globalForDb = globalThis as unknown as { flPool?: Pool };

export const pool =
  globalForDb.flPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.flPool = pool;
}

export async function tx<T>(
  fn: (c: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

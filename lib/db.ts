import { Pool } from 'pg';

/**
 * One pool per server instance, reused across requests.
 *
 * On a serverless platform each cold start would otherwise open its own
 * connections and never close them, and Postgres runs out of connections long
 * before it runs out of anything else. The global is what survives the
 * module reload that hot reloading and lambda reuse both do.
 *
 * POSTGRES_URL is the pooled connection string Vercel already sets for this
 * project's database -- the same one the baby-name app uses. Nothing new was
 * provisioned: this app's tables are all prefixed `fl_`, so the two share a
 * database without sharing anything else.
 *
 * It has to be the POOLED url and not POSTGRES_URL_NON_POOLING. A direct
 * connection works in development and runs the database out of connections
 * in production, for the reason above.
 */
const globalForDb = globalThis as unknown as { flPool?: Pool };

export const pool =
  globalForDb.flPool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL ?? process.env.DATABASE_URL,
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

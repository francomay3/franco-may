import { Pool } from 'pg';

/**
 * One pool per server instance, reused across requests.
 *
 * On a serverless platform each cold start would otherwise open its own
 * connections and never close them, and Postgres runs out of connections long
 * before it runs out of anything else. The global is what survives the
 * module reload that hot reloading and lambda reuse both do.
 *
 * DATABASE_URL is a Neon project reached directly rather than through
 * Vercel's marketplace, which keeps the database portable: moving this
 * service somewhere else one day is a change of one variable, not of a
 * billing relationship. Every table it uses is prefixed `fl_`.
 *
 * It has to be the POOLED url -- the host with `-pooler` in it. A direct
 * connection works in development and runs the database out of connections
 * in production, for the reason above.
 *
 * Note for anyone debugging this from a laptop: port 5432 is blocked on some
 * networks, including behind a corporate security agent. The connection is
 * accepted and then reset the instant the Postgres handshake goes out, which
 * reads as ECONNRESET and looks exactly like a dead database. Neon's
 * SQL-over-HTTP endpoint on 443 works from anywhere -- see
 * scripts/apply-fl-schema.cjs, which uses it for that reason.
 */
const globalForDb = globalThis as unknown as { flPool?: Pool };

export const pool =
  globalForDb.flPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
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

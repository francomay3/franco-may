/**
 * Apply scripts/fornlamningar-events.sql to a database.
 *
 *   node scripts/apply-fl-schema.cjs            # DATABASE_URL (Neon)
 *   node scripts/apply-fl-schema.cjs --local    # the docker-compose Postgres
 *
 * ONE SCRIPT, TWO TRANSPORTS, and the transport is chosen by the URL rather
 * than by a flag, because the flag would eventually disagree with the URL.
 *
 * Over HTTPS when the host is Neon's, which is not a preference: on some
 * networks -- a laptop behind a corporate security agent, for one -- port
 * 5432 accepts the TCP connection and then resets it the moment the Postgres
 * handshake is sent. The symptom is ECONNRESET and it looks exactly like a
 * dead database. Neon's SQL-over-HTTP endpoint goes out on 443 like
 * everything else and works from anywhere the web works.
 *
 * Over the Postgres protocol for anything else, because the HTTP endpoint is
 * Neon's own and the local container does not have one. This is the whole
 * reason the script was rewritten: a local database with a second migration
 * path beside it is two schemas that drift.
 *
 * THE SEMICOLON SPLITTER IS ONLY ON THE HTTP PATH. That endpoint runs one
 * statement per request, so the file has to be cut up, and that is safe only
 * because nothing in it contains a semicolon inside a string or a
 * dollar-quoted body -- if that ever changes, the splitter has to go. `pg`
 * takes the file whole in one simple query, so the local path has no such
 * constraint and is the one to trust when the SQL gets harder.
 *
 * The SQL is idempotent (CREATE TABLE IF NOT EXISTS, INSERT ... ON CONFLICT
 * DO NOTHING), so running this twice is a no-op rather than a mistake.
 */
const { readFileSync } = require('fs');
const { join } = require('path');

// The local URL is a literal and not a variable to configure, so that it
// matches docker-compose.yml by being the same text in both places. Port
// 15432 for the reason that file explains.
const LOCAL_URL = 'postgres://fornkoll:fornkoll@127.0.0.1:15432/fornkoll';

function envFromLocal(key) {
  const line = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .find(l => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '') : undefined;
}

function statements(sql) {
  return sql
    .split('\n')
    .filter(l => !l.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

/** Neon's SQL-over-HTTP endpoint: one statement per request. */
function overHttp(url) {
  const endpoint = `https://${new URL(url).hostname}/sql`;
  const run = async (query, params = []) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': url,
        'Neon-Raw-Text-Output': 'true',
      },
      body: JSON.stringify({ query, params }),
    });
    const text = await res.text();
    if (!res.ok)
      throw new Error(
        `${res.status} on "${query.slice(0, 60)}...": ${text.slice(0, 200)}`
      );
    return JSON.parse(text).rows;
  };
  return {
    apply: async sql => {
      const parts = statements(sql);
      for (const s of parts) await run(s);
      return parts.length;
    },
    run,
    close: async () => {},
  };
}

/** The Postgres wire protocol, for the local container. */
function overPostgres(url) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: url });
  let connected = false;
  const connect = async () => {
    if (!connected) {
      await client.connect();
      connected = true;
    }
  };
  return {
    apply: async sql => {
      await connect();
      // The whole file in one query. `pg` allows multiple statements in a
      // simple query, which is why the local path needs no splitter -- and
      // it is one implicit transaction, so a broken migration leaves nothing
      // half-applied.
      await client.query(sql);
      return statements(sql).length;
    },
    run: async (query, params = []) => {
      await connect();
      return (await client.query(query, params)).rows;
    },
    close: async () => {
      if (connected) await client.end();
    },
  };
}

(async () => {
  const local = process.argv.includes('--local');

  // DATABASE_URL only, for the remote case. There used to be a POSTGRES_URL
  // fallback, left over from Vercel's first Neon integration, and it was a
  // trap rather than a convenience: that project was deleted, its credential
  // stayed behind in .env.local, and the fallback quietly aimed migrations at
  // a database that no longer exists. The failure is "password
  // authentication failed for user 'default'", which reads as a wrong
  // password and not as a wrong database -- it cost two debugging rounds.
  // Both the variable and the fallback are gone now.
  const url = local
    ? LOCAL_URL
    : (process.env.DATABASE_URL ?? envFromLocal('DATABASE_URL'));
  if (!url)
    throw new Error(
      'no DATABASE_URL -- run `vercel env pull .env.local` in this repo'
    );

  const host = new URL(url).hostname;
  const db = host.endsWith('.neon.tech') ? overHttp(url) : overPostgres(url);
  // The host and never the URL, which carries the password.
  console.log(`${local ? 'local' : 'remote'}: ${host}`);

  try {
    const sql = readFileSync(
      join(__dirname, 'fornlamningar-events.sql'),
      'utf8'
    );
    const n = await db.apply(sql);

    const tables = await db.run(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name LIKE 'fl\\_%' ORDER BY 1`
    );
    const salt = await db.run(
      `SELECT length(value) AS n FROM fl_config WHERE key = 'ip_salt'`
    );
    const seq = await db.run('SELECT v FROM fl_event_seq WHERE id = 1');
    const events = await db.run('SELECT count(*) AS c FROM fl_events');
    console.log(`${n} statements applied`);
    console.log('tables:', tables.map(r => r.table_name).join(', '));
    console.log('ip_salt length:', salt[0]?.n ?? 'MISSING');
    console.log('seq:', seq[0]?.v, ' events:', events[0].c);
  } finally {
    await db.close();
  }
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

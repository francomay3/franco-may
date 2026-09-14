/**
 * Apply scripts/fornlamningar-events.sql to the project's database.
 *
 *   node scripts/apply-fl-schema.cjs
 *
 * It talks to Neon over HTTPS rather than over the Postgres port, which is
 * not a preference: on some networks -- a laptop behind a corporate security
 * agent, for one -- port 5432 accepts the TCP connection and then resets it
 * the moment the Postgres handshake is sent. The symptom is ECONNRESET and it
 * looks exactly like a dead database. Neon's SQL-over-HTTP endpoint goes out
 * on 443 like everything else and works from anywhere the web works.
 *
 * The endpoint runs ONE statement per request, so the file is split on
 * semicolons. That is safe only because nothing here contains a semicolon
 * inside a string or a dollar-quoted body; if that ever changes, this splitter
 * has to go.
 *
 * The SQL is idempotent (CREATE TABLE IF NOT EXISTS, INSERT ... ON CONFLICT
 * DO NOTHING), so running this twice is a no-op rather than a mistake.
 */
const { readFileSync } = require('fs');
const { join } = require('path');

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

(async () => {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    envFromLocal('DATABASE_URL') ??
    envFromLocal('POSTGRES_URL');
  if (!url) throw new Error('no DATABASE_URL');
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

  const sql = readFileSync(join(__dirname, 'fornlamningar-events.sql'), 'utf8');
  const parts = statements(sql);
  for (const s of parts) await run(s);

  const tables = await run(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'fl\\_%' ORDER BY 1`
  );
  const salt = await run(
    `SELECT length(value) AS n FROM fl_config WHERE key = 'ip_salt'`
  );
  const seq = await run('SELECT v FROM fl_event_seq WHERE id = 1');
  const events = await run('SELECT count(*) AS c FROM fl_events');
  console.log(`${parts.length} statements applied`);
  console.log('tables:', tables.map(r => r.table_name).join(', '));
  console.log('ip_salt length:', salt[0]?.n ?? 'MISSING');
  console.log('seq:', seq[0]?.v, ' events:', events[0].c);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

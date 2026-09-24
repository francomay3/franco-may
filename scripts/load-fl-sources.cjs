/**
 * Replace fl_sources with the file the pipeline wrote.
 *
 *   (in ../fornlamningar)  python3 export_sources.py
 *   node scripts/load-fl-sources.cjs /tmp/fl_sources.jsonl.gz
 *
 * Over Neon's HTTP endpoint for the same reason as apply-fl-schema.cjs: port
 * 5432 is reset on some networks. The table has to exist first -- it is in
 * fornlamningar-events.sql, so run apply-fl-schema.cjs once.
 *
 * Upsert everything, then delete what the file did not have. In that order
 * so a load that dies halfway leaves the old generation readable plus part
 * of the new one, never an empty table; running it again finishes the job.
 */
const { readFileSync } = require('fs');
const { gunzipSync } = require('zlib');
const { join } = require('path');

const BATCH = 400;

function envFromLocal(key) {
  const line = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .find(l => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '') : undefined;
}

(async () => {
  const file = process.argv[2];
  if (!file) throw new Error('usage: load-fl-sources.cjs <fl_sources.jsonl.gz>');
  const url = process.env.DATABASE_URL ?? envFromLocal('DATABASE_URL');
  if (!url)
    throw new Error(
      'no DATABASE_URL -- run `vercel env pull .env.local` in this repo'
    );
  const endpoint = `https://${new URL(url).hostname}/sql`;
  const run = async (query, params = []) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': url,
      },
      body: JSON.stringify({ query, params }),
    });
    const text = await res.text();
    if (!res.ok)
      throw new Error(`${res.status} on "${query.slice(0, 60)}...": ${text.slice(0, 200)}`);
    return JSON.parse(text).rows;
  };

  const rows = gunzipSync(readFileSync(file))
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l));
  const generations = new Set(rows.map(r => r.generation));
  if (generations.size !== 1)
    throw new Error(`expected one generation, got ${[...generations]}`);
  const [generation] = generations;

  for (let i = 0; i < rows.length; i += BATCH) {
    await run(
      `INSERT INTO fl_sources
         SELECT * FROM jsonb_populate_recordset(null::fl_sources, $1::jsonb)
       ON CONFLICT (place_uuid, source_id) DO UPDATE SET
         cluster_id = EXCLUDED.cluster_id, kind = EXCLUDED.kind,
         lang = EXCLUDED.lang, title = EXCLUDED.title, body = EXCLUDED.body,
         author = EXCLUDED.author, publisher = EXCLUDED.publisher,
         licence = EXCLUDED.licence, licence_url = EXCLUDED.licence_url,
         url = EXCLUDED.url, trust = EXCLUDED.trust, used = EXCLUDED.used,
         fetched_at = EXCLUDED.fetched_at, generation = EXCLUDED.generation`,
      [JSON.stringify(rows.slice(i, i + BATCH))]
    );
    process.stdout.write(`\r${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  // By key and not by generation: a rebuild of the sources inside one
  // release -- a Wikipedia lead replaced by the whole article -- keeps the
  // generation and still retires rows.
  const keys = rows.map(r => ({ place_uuid: r.place_uuid, source_id: r.source_id }));
  const gone = await run(
    `DELETE FROM fl_sources f
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_to_recordset($1::jsonb)
                      AS k(place_uuid text, source_id bigint)
         WHERE k.place_uuid = f.place_uuid AND k.source_id = f.source_id)
      RETURNING 1`,
    [JSON.stringify(keys)]
  );
  const [{ n, places }] = await run(
    'SELECT count(*) AS n, count(DISTINCT place_uuid) AS places FROM fl_sources'
  );
  console.log(
    `\ngeneration ${generation}: ${n} sources for ${places} places, ${gone.length} old rows removed`
  );
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

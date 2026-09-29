/**
 * Load the photograph catalog the pipeline exported.
 *
 *   (in ../fornlamningar)  python3 export_place_photos.py
 *   node scripts/load-fl-photos.cjs /tmp/fl_photos.jsonl.gz
 *
 * Over Neon's HTTP endpoint for the same reason as apply-fl-schema.cjs.
 * The table has to exist first -- it is in fornlamningar-events.sql.
 *
 * Upsert the picture, then delete what this load did not touch. The
 * prioritized flag is not in the file and the update does not set it, so a
 * mark survives the next crawl. A photograph that disappeared loses its
 * row, and its mark with it.
 */
const { readFileSync } = require('fs');
const { gunzipSync } = require('zlib');
const { join } = require('path');

const BATCH = 200;

function envFromLocal(key) {
  const line = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .find(l => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '') : undefined;
}

(async () => {
  const file = process.argv[2];
  if (!file) throw new Error('usage: load-fl-photos.cjs <fl_photos.jsonl.gz>');
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
      throw new Error(
        `${res.status} on "${query.slice(0, 60)}...": ${text.slice(0, 300)}`
      );
    return JSON.parse(text).rows;
  };

  const rows = gunzipSync(readFileSync(file))
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l));
  const loadId = new Date().toISOString();

  for (let i = 0; i < rows.length; i += BATCH) {
    await run(
      `INSERT INTO fl_photos (
         place_uuid, source, file, cluster_id, thumb, page, author, licence,
         ord, load_id
       )
       SELECT r.place_uuid, r.source, r.file, r.cluster_id, r.thumb, r.page,
              r.author, r.licence, r.ord, $2
         FROM jsonb_to_recordset($1::jsonb) AS r(
           place_uuid text, source text, file text, cluster_id text,
           thumb text, page text, author text, licence text, ord int
         )
       ON CONFLICT (place_uuid, source, file) DO UPDATE SET
         cluster_id = EXCLUDED.cluster_id,
         thumb = EXCLUDED.thumb,
         page = EXCLUDED.page,
         author = EXCLUDED.author,
         licence = EXCLUDED.licence,
         ord = EXCLUDED.ord,
         load_id = EXCLUDED.load_id`,
      [JSON.stringify(rows.slice(i, i + BATCH)), loadId]
    );
    process.stdout.write(
      `\r${Math.min(i + BATCH, rows.length)}/${rows.length}`
    );
  }

  const [{ n: gone }] = await run(
    `WITH d AS (
       DELETE FROM fl_photos WHERE load_id IS DISTINCT FROM $1 RETURNING 1
     )
     SELECT count(*) AS n FROM d`,
    [loadId]
  );
  const [{ n, places, marked }] = await run(
    `SELECT count(*) AS n,
            count(DISTINCT place_uuid) AS places,
            count(*) FILTER (WHERE prioritized) AS marked
       FROM fl_photos`
  );
  console.log(
    `\n${n} photographs for ${places} places, ${marked} prioritized, ${gone} old rows removed`
  );
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

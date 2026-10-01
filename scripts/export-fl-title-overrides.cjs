/**
 * Write the titles a person typed, where the pipeline reads them.
 *
 *   node scripts/export-fl-title-overrides.cjs [out]
 *   default out: ../fornlamningar/src/data/title_overrides.jsonl
 *
 * Every row, every time. build_clusters.py and build_tiles.py take this
 * file as the whole list, so a place missing from it goes back to the
 * published title. Over HTTPS for the reason in apply-fl-schema.cjs.
 */
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function envFromLocal(key) {
  const line = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .find(l => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '') : undefined;
}

(async () => {
  const out =
    process.argv[2] ??
    join(
      __dirname,
      '..',
      '..',
      'fornlamningar',
      'src',
      'data',
      'title_overrides.jsonl'
    );
  const url = process.env.DATABASE_URL ?? envFromLocal('DATABASE_URL');
  if (!url)
    throw new Error(
      'no DATABASE_URL -- run `vercel env pull .env.local` in this repo'
    );
  const res = await fetch(`https://${new URL(url).hostname}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': url,
    },
    body: JSON.stringify({
      query: `SELECT place_uuid, title, set_by, updated_at
                FROM fl_title_overrides
               ORDER BY place_uuid`,
      params: [],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  const rows = JSON.parse(text).rows;
  writeFileSync(
    out,
    rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')
  );
  console.log(`${rows.length} title overrides -> ${out}`);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

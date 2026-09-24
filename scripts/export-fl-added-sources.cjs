/**
 * Write the hand-added sources where the pipeline reads them.
 *
 *   node scripts/export-fl-added-sources.cjs [out]
 *   default out: ../fornlamningar/src/data/added_sources.jsonl
 *
 * Published and not removed, all of them, every time: build_sources.py takes
 * this file as the whole truth, so a row missing from it is one somebody took
 * back and the pipeline retires it. Over HTTPS for the reason in
 * apply-fl-schema.cjs.
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
    join(__dirname, '..', '..', 'fornlamningar', 'src', 'data', 'added_sources.jsonl');
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
      query: `SELECT id, place_uuid, kind, lang, title, body, publisher,
                     licence, licence_url, url, created_at
                FROM fl_sources_added
               WHERE status = 'published' AND removed_at IS NULL
               ORDER BY id`,
      params: [],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  const rows = JSON.parse(text).rows;
  writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  console.log(`${rows.length} added sources -> ${out}`);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

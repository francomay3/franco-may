/**
 * Write the prioritized photographs where the pipeline reads them.
 *
 *   node scripts/export-fl-photo-priority.cjs [out]
 *   default out: ../fornlamningar/src/data/photo_priority.jsonl
 *
 * Every marked row, every time. build_tiles.py takes this file as the whole
 * list, so a photograph missing from it is no longer preferred. Over HTTPS
 * for the reason in apply-fl-schema.cjs.
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
      'photo_priority.jsonl'
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
      query: `SELECT cluster_id, source, file
                FROM fl_photos
               WHERE prioritized
               ORDER BY cluster_id, ord`,
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
  console.log(`${rows.length} prioritized photographs -> ${out}`);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

/**
 * Write every admin flag on a place, so they can be worked through.
 *
 *   node scripts/export-fl-flags.cjs [out]
 *   default out: ../fornlamningar/src/data/place_flags.jsonl
 *
 * Every row, open ones first. corrected_at means the note was dealt with
 * and kept. A missing row was deleted. Over HTTPS for the reason in
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
    join(
      __dirname,
      '..',
      '..',
      'fornlamningar',
      'src',
      'data',
      'place_flags.jsonl'
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
      query: `SELECT id, place_uuid, note, created_by, created_at,
                     corrected_at, corrected_by
                FROM fl_place_flags
               ORDER BY corrected_at IS NULL DESC, created_at, id`,
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
  const open = rows.filter(r => !r.corrected_at).length;
  console.log(`${rows.length} flags (${open} open) -> ${out}`);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});

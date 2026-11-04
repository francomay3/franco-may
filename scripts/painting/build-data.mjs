// Builds the data behind /painting from the downloaded Patreon folder.
//
//   node scripts/painting/build-data.mjs [source-dir]
//
// source-dir (default ~/Desktop/Patrick Okrasinski) holds posts/, overrides/
// and compressed/ (the 720p videos made by compress-videos.sh).
//
// WHAT GOES WHERE
//   public/painting/**/*.webp          images, committed to git
//   scripts/painting/out/library.json  titles, text, durations and image paths.
//                                      NOT committed: publish.sh uploads it to
//                                      Storage, where the rules gate it, so the
//                                      Patreon text is not readable by anyone
//                                      who has not signed in.
//
// Which attachment is the reference photo / the finished painting is the PICKS
// table below; multi-session paintings are SERIES. Missing images: drop a
// reference.jpg / final.jpg into <source-dir>/overrides/<postId or seriesId>/.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const SRC = path.resolve(
  process.argv[2] ?? path.join(os.homedir(), 'Desktop/Patrick Okrasinski')
);
const POSTS = path.join(SRC, 'posts');
const OVERRIDES = path.join(SRC, 'app/overrides');
const ROOT = path.resolve(import.meta.dirname, '../..');
const PUBLIC = path.join(ROOT, 'public/painting');
const OUT = path.join(import.meta.dirname, 'out');
const IMG_RE = /\.(jpe?g|png|webp)$/i;
const SKIP_RE = /^(cover|thumbnail|thumbanail|screenshot|still)/i;

// Multi-session paintings, in watch order.
const SERIES = [
  {
    id: 'sedona',
    title: 'Sedona Cathedral Rock',
    parts: ['92220069', '92661797', '93062361'],
  },
  {
    id: 'simplon-pass',
    title: "Copying Sargent's Simplon Pass",
    parts: ['95901611', '96743326'],
  },
  {
    id: 'marble-monument',
    title: 'Marble Monument in Rim Light',
    parts: ['103556737', '109214546'],
  },
  {
    id: 'florence-park',
    title: 'Florence Park',
    parts: ['104814186', '104789287'],
  },
  {
    id: 'snowy-field',
    title: 'Snowy Field and Fast Moving Clouds',
    parts: ['121652723', '123819100'],
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour',
    parts: ['135484638', '138171807'],
  },
];

// Which attachment is the reference photo and which is the finished painting.
const PICKS = {
  101728847: ['Scene Reference.jpg', 'Leafless Trees HIRES 9x12.jpg'],
  103556737: ['San Niccolo Reference.jpg', '01 San Niccolo.jpg'],
  109214546: [null, 'DAY 1 VS DAY 2.jpg'],
  107492626: ['Reference.jpg', 'HiRes Painting.jpg'],
  111507316: ['Alexei Savrasov Oaks.jpg', null],
  113291704: [null, 'HiRes Orsanmichele.jpg'],
  115234636: ['Tyniec Castle Reference.jpg', 'Tyniec Caslte HIRES.jpg'],
  117440905: ['reference.jpg', 'AutumnHillsHires.jpg'],
  119228993: ['A Day in June, 1895, 30x40cm.JPG', 'Finished Study, Hires.jpg'],
  121652723: ['Reference.jpg', 'Skylands Manor Snow HiRes.jpg'],
  123819100: [null, 'Skyland Manor Finished Studio.jpg'],
  127968083: ['Lomnicky Stit Reference.jpg', 'Lomnicky Stit HIRES.jpg'],
  130856998: ['Dappled Door Reference.jpg', 'Dappled Door HIRES Painting.jpg'],
  133334513: ['Panoramic Vista Reference.jpg', 'Panoramic Vista Painting.jpg'],
  135484638: ['Golden Fields Reference.jpg', 'Golden Fields Plein Air.jpg'],
  138171807: ['Reference 1.jpg', 'Golden Hour Hires.jpg'],
  143015007: ['Field in Silesia Reference.jpg', 'Field in Silesia HiRes.jpg'],
  145074423: ['Reference 1.jpg', 'Sunset Path Painting.jpg'],
  150094747: ['Mossy Roots Reference.jpg', 'Mossy Roots HirRes.jpg'],
  152345842: ['Big Brush Snow Reference.JPG', 'Big Brush Snow Hires.jpg'],
  157068928: [
    'Sugar Maple Reference.jpg',
    'Portrait of a Sugar Maple HiRes.jpg',
  ],
  160103021: [
    'Clouds Over Florence Reference.jpg',
    'Clouds Over Florence HIRES.jpg',
  ],
  162514520: ['Reference.jpg', 'Klein Wellhorn HiRes.jpg'],
  165905483: [
    'Summer Road in France Reference.jpg',
    'Summer Road in France Hires.jpg',
  ],
  168457762: ['Shadows in the Rye Reference.jpg', 'Shadows in the Rye.jpg'],
  170757185: [
    'English Oaks Reference.jpg',
    '62. English Oaks by the River.jpg',
  ],
  88609297: ['P1000142.jpg', 'September Patreon HIRES 9x12.jpg'],
  90453273: [null, '12 Salute, Evening.jpg'],
  92220069: ['IMG_5115.jpg', null],
  93892672: ['December Reference.jpg', 'December Painting.jpg'],
  95901611: ['simplon_pass.jpg', null],
  97667550: ['Scene Reference.JPG', 'Winter River Bank.jpg'],
};

const THUMB_W = 900;
const FULL_W = 1600;
const POSTER_W = 640;
const POSTER_FULL_W = 1280;

const slug = name =>
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
const stripHtml = h =>
  h
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
// The text is Patreon's own HTML. It is rendered with dangerouslySetInnerHTML,
// so scripts and inline handlers are dropped here. Links to Patreon are
// unwrapped to their text: nothing on the page points back at it.
const safeHtml = h =>
  h
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(
      /<a\s[^>]*href="[^"]*patreon\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
      '$1'
    );

/** Writes a WebP no wider than `width`; skips work when the output is newer. */
async function webp(src, destRel, width) {
  const dest = path.join(PUBLIC, destRel);
  if (
    fs.existsSync(dest) &&
    fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs
  ) {
    return `/painting/${destRel}`;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(dest);
  return `/painting/${destRel}`;
}

async function override(id, kind) {
  const dir = path.join(OVERRIDES, id);
  if (!fs.existsSync(dir)) return null;
  const f = fs
    .readdirSync(dir)
    .find(n => n.toLowerCase().startsWith(kind) && IMG_RE.test(n));
  return f
    ? webp(path.join(dir, f), `override/${id}/${kind}.webp`, THUMB_W)
    : null;
}

const posts = {};
for (const dir of fs.readdirSync(POSTS).filter(d => /^\d+ - /.test(d))) {
  const id = dir.split(' - ')[0];
  const base = path.join(POSTS, dir);
  const api = JSON.parse(
    fs.readFileSync(path.join(base, 'post_info/post-api.json'), 'utf8')
  ).data.attributes;
  // the API payload has no body HTML; the downloader's info.txt does
  const info = fs.readFileSync(path.join(base, 'post_info/info.txt'), 'utf8');
  const content =
    info.match(/^Content: ([\s\S]*?)\nPublished: /m)?.[1]?.trim() ?? '';
  const vdir = path.join(base, 'video');
  const mp4 = fs.readdirSync(vdir).find(f => f.endsWith('.mp4'));
  const poster = fs.readdirSync(vdir).find(f => f.endsWith('-thumbnail.jpg'));
  const duration = parseFloat(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      path.join(vdir, mp4),
    ]).toString()
  );

  // all images, attachments first, deduped by name
  const seen = new Set();
  const used = new Set();
  const gallery = [];
  for (const sub of ['attachments', 'images']) {
    const p = path.join(base, sub);
    if (!fs.existsSync(p)) continue;
    for (const name of fs.readdirSync(p).sort()) {
      if (seen.has(name) || name.startsWith('.')) continue;
      seen.add(name);
      if (!IMG_RE.test(name) || SKIP_RE.test(name)) continue;
      let s = slug(name);
      for (let n = 2; used.has(s); n++) s = `${slug(name)}-${n}`;
      used.add(s);
      gallery.push({
        name,
        thumb: await webp(path.join(p, name), `${id}/${s}.webp`, THUMB_W),
        full: await webp(path.join(p, name), `${id}/${s}-full.webp`, FULL_W),
      });
    }
  }
  const [refName, finalName] = PICKS[id] ?? [null, null];
  const pick = n =>
    n
      ? (gallery.find(g => g.name === n) ??
        (console.warn('!! pick not found', id, n), null))
      : null;

  posts[id] = {
    id,
    title: api.title,
    date: api.published_at,
    summary: stripHtml(content),
    html: safeHtml(content),
    // Where publish.sh puts it in the bucket. The page asks Storage for it by
    // this path; nothing in the repo can play it.
    video: `painting/videos/${id}.mp4`,
    // the file compress-videos.sh made, so publish.sh knows what to upload
    videoSource: `compressed/${id}/${mp4.split(' ')[0]}.mp4`,
    poster: await webp(path.join(vdir, poster), `${id}/_poster.webp`, POSTER_W),
    posterFull: await webp(
      path.join(vdir, poster),
      `${id}/_poster-full.webp`,
      POSTER_FULL_W
    ),
    duration: Math.round(duration),
    reference:
      (await override(id, 'reference')) ?? pick(refName)?.thumb ?? null,
    final: (await override(id, 'final')) ?? pick(finalName)?.thumb ?? null,
    gallery,
  };
}

const seriesOf = {};
for (const s of SERIES) for (const p of s.parts) seriesOf[p] = s.id;

const items = [];
const missing = [];
for (const s of SERIES) {
  const parts = s.parts.map(p => posts[p]);
  const first = parts.find(p => p.reference) ?? null;
  const last = [...parts].reverse().find(p => p.final) ?? null;
  const reference =
    (await override(s.id, 'reference')) ?? first?.reference ?? null;
  const final = (await override(s.id, 'final')) ?? last?.final ?? null;
  items.push({
    kind: 'series',
    id: s.id,
    title: s.title,
    date: parts.at(-1).date,
    summary: parts[0].summary,
    reference,
    final,
    parts: s.parts,
  });
  if (!reference) missing.push(`series ${s.id} (${s.title}): reference`);
  if (!final) missing.push(`series ${s.id} (${s.title}): final`);
}
for (const p of Object.values(posts)) {
  if (seriesOf[p.id]) {
    p.series = seriesOf[p.id];
    continue;
  }
  items.push({
    kind: 'post',
    id: p.id,
    title: p.title,
    date: p.date,
    summary: p.summary,
    reference: p.reference,
    final: p.final,
  });
  if (!p.reference) missing.push(`post ${p.id} (${p.title}): reference`);
  if (!p.final) missing.push(`post ${p.id} (${p.title}): final`);
}
items.sort((a, b) => b.date.localeCompare(a.date));

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'library.json'),
  JSON.stringify({
    items,
    posts,
    series: Object.fromEntries(SERIES.map(s => [s.id, s])),
  })
);
console.log(`${items.length} list rows, ${Object.keys(posts).length} posts`);
console.log(
  missing.length
    ? 'MISSING IMAGES:\n' + missing.join('\n')
    : 'no missing images'
);

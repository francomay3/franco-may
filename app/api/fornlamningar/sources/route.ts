import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { pool } from '@/lib/db';
import { placeUuidOf } from '@/lib/lamning';

/**
 * Add a source to a place by hand, or take one back.
 *
 * A Wikipedia link is fetched HERE, whole, the same way the pipeline fetches
 * one (crawl_wikimedia.fetch_bodies): TextExtracts, plain text, headings
 * kept, reference sections cut. Anything else needs its text pasted, because
 * an arbitrary web page is not something to scrape blind from a serverless
 * function -- and a page whose text a person chose is a better source than
 * the same page with its menus and cookie banner.
 *
 * Admin only for now. Visitors adding sources from the phone is the reason
 * `added_by` and `status` exist: when that opens, a non-admin row goes in
 * 'pending' and nothing downstream reads a pending row.
 */

const WIKI = /^https?:\/\/([a-z-]+)\.(?:m\.)?wikipedia\.org\/wiki\/([^?#]+)/i;

const TAIL = new Set([
  'referenser',
  'källor',
  'noter',
  'externa länkar',
  'se även',
  'litteratur',
  'vidare läsning',
  'källhänvisningar',
  'fotnoter',
  'references',
  'sources',
  'notes',
  'external links',
  'see also',
  'further reading',
  'bibliography',
  'literature',
  'citations',
]);

/** Keep in step with crawl_wikimedia.cut_tail. */
function cutTail(text: string): string {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (s.startsWith('==') && !s.startsWith('===') && s.endsWith('==')) {
      if (
        TAIL.has(
          s
            .replace(/^=+|=+$/g, '')
            .trim()
            .toLowerCase()
        )
      ) {
        break;
      }
    }
    out.push(line);
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function wikipedia(url: string) {
  const m = url.match(WIKI);
  if (!m) {
    return null;
  }
  const lang = m[1].toLowerCase();
  const title = decodeURIComponent(m[2]).replace(/_/g, ' ');
  const api = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({
    action: 'query',
    prop: 'extracts',
    explaintext: '1',
    exsectionformat: 'wiki',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    titles: title,
  })) {
    api.searchParams.set(k, v);
  }
  const res = await fetch(api, {
    headers: { 'User-Agent': 'fornkoll/1.0 (https://franco-may.com)' },
  });
  if (!res.ok) {
    return { error: `Wikipedia answered ${res.status}` };
  }
  const page = (await res.json())?.query?.pages?.[0];
  if (!page || page.missing) {
    return { error: 'No such Wikipedia article' };
  }
  const body = cutTail(page.extract ?? '');
  if (!body) {
    return { error: 'The article has no text' };
  }
  return {
    kind: 'wikipedia',
    lang,
    title: page.title as string,
    body,
    publisher: `Wikipedia (${lang})`,
    licence: 'CC BY-SA 4.0',
    licence_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(
      (page.title as string).replace(/ /g, '_')
    )}`,
  };
}

const addSchema = z.object({
  action: z.literal('add'),
  place: z.string().min(1),
  url: z.string().url().optional(),
  title: z.string().max(300).optional(),
  body: z.string().max(200_000).optional(),
  lang: z.string().max(5).optional(),
});
const removeSchema = z.object({
  action: z.literal('remove'),
  id: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const uid = (await uidOf(request)) ?? 'admin';
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'expected a JSON body' },
      { status: 400 }
    );
  }

  const removing = removeSchema.safeParse(raw);
  if (removing.success) {
    const { rowCount } = await pool.query(
      `UPDATE fl_sources_added SET removed_at = now()
        WHERE id = $1 AND removed_at IS NULL`,
      [removing.data.id]
    );
    return NextResponse.json({ ok: rowCount === 1 });
  }

  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { place, url, title, body, lang } = parsed.data;
  const uuid = placeUuidOf(place);
  if (!uuid) {
    return NextResponse.json(
      { error: 'no place with that id' },
      { status: 404 }
    );
  }

  let row;
  const wiki = url ? await wikipedia(url) : null;
  if (wiki && 'error' in wiki) {
    return NextResponse.json({ error: wiki.error }, { status: 422 });
  } else if (wiki) {
    row = wiki;
  } else {
    const text = (body ?? '').trim();
    if (text.length < 40) {
      return NextResponse.json(
        {
          error: 'Paste the text of the page: only Wikipedia links are fetched',
        },
        { status: 422 }
      );
    }
    row = {
      kind: 'web',
      lang: lang ?? 'sv',
      title: title?.trim() || null,
      body: text,
      publisher: url ? new URL(url).hostname.replace(/^www\./, '') : null,
      licence: 'unresolved',
      licence_url: null,
      url: url ?? null,
    };
  }

  const { rows } = await pool.query(
    `INSERT INTO fl_sources_added
       (place_uuid, kind, lang, title, body, publisher, licence, licence_url,
        url, added_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      uuid,
      row.kind,
      row.lang,
      row.title,
      row.body,
      row.publisher,
      row.licence,
      row.licence_url,
      row.url,
      uid,
    ]
  );
  return NextResponse.json({
    ok: true,
    id: Number(rows[0].id),
    title: row.title,
  });
}

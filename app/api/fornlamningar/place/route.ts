import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/admin';
import { pool, tx } from '@/lib/db';
import { cleanPayload, publicAuthor } from '@/lib/fl-authors';
import { placeUuidOf } from '@/lib/lamning';
import { placeCoord } from '@/lib/place-coords';
import { withdrawPhoto } from '@/lib/withdraw-photo';

/**
 * One place, for the moderator: what was published there, and the register
 * text it sits on.
 *
 * The id in the query is whatever a person would type. L1997:4707 is a
 * register number; the uuid is what the phone stores. Both resolve here.
 * See lib/lamning.ts for why those are not the same string.
 */

type Desc = {
  title?: string;
  content?: string;
  images?: { f?: string; by?: string; lic?: string; page?: string }[];
};

const shards = new Map<string, Record<string, Desc>>();

function description(uuid: string): Desc | null {
  const shard = uuid.slice(0, 2).toLowerCase();
  let bag = shards.get(shard);
  if (!bag) {
    try {
      bag = JSON.parse(
        readFileSync(
          join(process.cwd(), 'public', 'descriptions', `${shard}.json`),
          'utf8'
        )
      ) as Record<string, Desc>;
    } catch {
      bag = {};
    }
    shards.set(shard, bag);
  }
  return bag[uuid] ?? null;
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const query = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!query) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }
  const uuid = placeUuidOf(query);
  if (!uuid) {
    return NextResponse.json({ query, uuid: null });
  }

  const desc = description(uuid);
  const coord = placeCoord(uuid);
  const [
    { rows: comments },
    { rows: pending },
    { rows: published },
    { rows: texts },
    { rows: added },
  ] = await Promise.all([
      pool.query(
        `SELECT c.event_id, c.author, c.payload, c.server_ts,
                r.server_ts AS removed_at
           FROM fl_events c
           LEFT JOIN fl_events r
                  ON r.kind = 'comment_removed'
                 AND r.payload->>'target_event_id' = c.event_id::text
          WHERE c.kind = 'comment' AND c.place_uuid = $1
          ORDER BY c.seq DESC`,
        [uuid]
      ),
      pool.query(
        `SELECT q.event_id, q.payload, q.created_at
           FROM fl_photo_queue q
          WHERE q.place_uuid = $1
            AND NOT EXISTS (
              SELECT 1 FROM fl_events r
               WHERE r.kind = 'photo_removed'
                 AND r.payload->>'target_event_id' = q.event_id::text
            )
          ORDER BY q.created_at`,
        [uuid]
      ),
      pool.query(
        `SELECT e.event_id, e.payload, e.server_ts
           FROM fl_events e
          WHERE e.kind = 'photo' AND e.place_uuid = $1
            AND NOT EXISTS (
              SELECT 1 FROM fl_events r
               WHERE r.kind = 'photo_removed'
                 AND r.payload->>'target_event_id' = e.event_id::text
            )
          ORDER BY e.seq`,
        [uuid]
      ),
      pool.query(
        `SELECT source_id, kind, lang, title, body, author, publisher,
                licence, url, trust, used, fetched_at
           FROM fl_sources
          WHERE place_uuid = $1
          ORDER BY used DESC, trust DESC NULLS LAST, source_id`,
        [uuid]
      ),
      pool.query(
        `SELECT id, kind, lang, title, body, publisher, licence, url,
                created_at
           FROM fl_sources_added
          WHERE place_uuid = $1 AND removed_at IS NULL
          ORDER BY id`,
        [uuid]
      ),
    ]);
  // Once the pipeline has taken an added source in, it comes back in
  // fl_sources too. Listed once, as the pipeline's, which is the one the
  // description can actually have used.
  const known = new Set(texts.map(r => r.url).filter(Boolean));

  const commentOut = [];
  for (const r of comments) {
    commentOut.push({
      event_id: r.event_id,
      author: await publicAuthor(r.author),
      body: (cleanPayload(r.payload).body as string) ?? '',
      created_at: new Date(r.server_ts).toISOString(),
      removed_at: r.removed_at ? new Date(r.removed_at).toISOString() : null,
    });
  }

  const photo = (
    r: { event_id: string; payload: { width?: number; height?: number } },
    status: 'pending' | 'published',
    at: Date
  ) => ({
    event_id: r.event_id,
    status,
    width: r.payload?.width ?? null,
    height: r.payload?.height ?? null,
    created_at: at.toISOString(),
  });

  return NextResponse.json({
    query,
    uuid,
    title: desc?.title ?? null,
    content: desc?.content ?? null,
    fornsok: `https://app.raa.se/open/fornsok/lamning/${uuid}`,
    lon: coord?.[0] ?? null,
    lat: coord?.[1] ?? null,
    texts: [
      ...added
        .filter(r => !r.url || !known.has(r.url))
        .map(r => ({
          source_id: -Number(r.id),
          added_id: Number(r.id),
          kind: r.kind,
          lang: r.lang,
          title: r.title,
          body: r.body,
          author: null,
          publisher: r.publisher,
          licence: r.licence,
          url: r.url,
          trust: null,
          used: false,
          fetched_at: new Date(r.created_at).toISOString(),
        })),
      ...texts.map(r => ({
      source_id: Number(r.source_id),
      added_id: null,
      kind: r.kind,
      lang: r.lang,
      title: r.title,
      body: r.body,
      author: r.author,
      publisher: r.publisher,
      licence: r.licence,
      url: r.url,
      trust: r.trust,
      used: r.used,
      fetched_at: r.fetched_at,
    })),
    ],
    sources: (desc?.images ?? []).map(img => ({
      file: img.f ?? '',
      by: img.by ?? null,
      lic: img.lic ?? null,
      page: img.page ?? null,
    })),
    comments: commentOut,
    photos: [
      ...pending.map(r => photo(r, 'pending', new Date(r.created_at))),
      ...published.map(r => photo(r, 'published', new Date(r.server_ts))),
    ],
  });
}

const deleteSchema = z.object({
  action: z.literal('delete_photo'),
  event_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'expected a JSON body' }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { event_id } = parsed.data;

  try {
    await tx(c => withdrawPhoto(c, event_id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('photo delete failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

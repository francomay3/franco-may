import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { pool, tx } from '@/lib/db';
import { cleanPayload, publicAuthor } from '@/lib/fl-authors';
import { flagsForPlace } from '@/lib/fl-flags';
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

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

type ArchiveRow = {
  source: string;
  file: string;
  thumb: string;
  page: string | null;
  author: string | null;
  licence: string | null;
  ord: number;
  prioritized: boolean;
};

type RatingView = {
  /** This admin's own score, the latest one under their account. */
  mine: number | null;
  /** What the app shows: the mean, one vote per person. */
  average: number | null;
  votes: number;
};

/**
 * The ratings the app is averaging for this place, and which of them is
 * the caller's.
 *
 * A person who rated from two phones is one vote. The devices stay as
 * separate authors in the log; the account they were linked to is the
 * person, which is the same collapse the phone does when it syncs.
 */
function ratingOf(uuid: string, uid: string): Promise<RatingView> {
  return pool
    .query<{ payload: { stars?: unknown }; mine: boolean }>(
      `WITH latest AS (
         SELECT DISTINCT ON (e.author)
                e.author, e.seq, e.payload
           FROM fl_events e
          WHERE e.place_uuid = $1 AND e.kind = 'rating'
            AND NOT EXISTS (
              SELECT 1 FROM fl_events d
               WHERE d.kind = 'rating_delete'
                 AND d.payload->>'target_event_id' = e.event_id::text
            )
          ORDER BY e.author, e.seq DESC
       )
       SELECT DISTINCT ON (COALESCE(d.account, l.author))
              l.payload,
              (COALESCE(d.account, l.author) = $2) AS mine
         FROM latest l
         LEFT JOIN fl_account_devices d ON d.device = l.author
        ORDER BY COALESCE(d.account, l.author), l.seq DESC`,
      [uuid, uid]
    )
    .then(r => {
      const scored = r.rows.flatMap(row => {
        const stars = row.payload?.stars;
        return typeof stars === 'number' ? [{ stars, mine: row.mine }] : [];
      });
      const mine = scored.find(row => row.mine)?.stars ?? null;
      const votes = scored.length;
      const average =
        votes > 0
          ? scored.reduce((sum, row) => sum + row.stars, 0) / votes
          : null;
      return { mine, average, votes };
    });
}

function pinOverrideOf(uuid: string) {
  return pool
    .query<{ lon: number; lat: number }>(
      `SELECT lon, lat FROM fl_pin_overrides WHERE place_uuid = $1`,
      [uuid]
    )
    .then(r => {
      const row = r.rows[0];
      if (!row) {
        return null;
      }
      return { lon: Number(row.lon), lat: Number(row.lat) };
    })
    .catch(err => {
      if (missingTable(err)) {
        return null;
      }
      throw err;
    });
}

function uninterestingOf(uuid: string) {
  return pool
    .query(`SELECT 1 FROM fl_uninteresting WHERE place_uuid = $1`, [uuid])
    .then(r => r.rows.length > 0)
    .catch(err => {
      if (missingTable(err)) {
        return false;
      }
      throw err;
    });
}

function archiveOf(uuid: string) {
  return pool
    .query<ArchiveRow>(
      `SELECT source, file, thumb, page, author, licence, ord, prioritized
         FROM fl_photos
        WHERE place_uuid = $1
        ORDER BY ord`,
      [uuid]
    )
    .then(r => r.rows)
    .catch(err => {
      if (missingTable(err)) {
        return [] as ArchiveRow[];
      }
      throw err;
    });
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
  const uid = await uidOf(request);
  const [
    { rows: comments },
    { rows: pending },
    { rows: published },
    { rows: texts },
    { rows: added },
    archive,
    uninteresting,
    rating,
    flags,
    pinOverride,
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
    archiveOf(uuid),
    uninterestingOf(uuid),
    uid
      ? ratingOf(uuid, uid)
      : Promise.resolve({ mine: null, average: null, votes: 0 }),
    flagsForPlace(uuid),
    pinOverrideOf(uuid),
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
    lon: pinOverride?.lon ?? coord?.[0] ?? null,
    lat: pinOverride?.lat ?? coord?.[1] ?? null,
    calculated: coord == null ? null : { lon: coord[0], lat: coord[1] },
    pin_override: pinOverride,
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
    uninteresting,
    rating,
    flags,
    archive: archive.map(r => ({
      source: r.source,
      file: r.file,
      thumb: r.thumb,
      page: r.page,
      author: r.author,
      licence: r.licence,
      ord: Number(r.ord),
      prioritized: r.prioritized,
    })),
    comments: commentOut,
    photos: [
      ...pending.map(r => photo(r, 'pending', new Date(r.created_at))),
      ...published.map(r => photo(r, 'published', new Date(r.server_ts))),
    ],
  });
}

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('delete_photo'),
    event_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('prioritize_photo'),
    place: z.string().min(1),
    source: z.string().min(1).max(64),
    file: z.string().min(1).max(2000),
    prioritized: z.boolean(),
  }),
  z.object({
    action: z.literal('uninteresting'),
    place: z.string().min(1),
    uninteresting: z.boolean(),
  }),
  z.object({
    action: z.literal('rate'),
    place: z.string().min(1),
    stars: z.number().int().min(1).max(5),
  }),
  z.object({
    action: z.literal('set_pin'),
    place: z.string().min(1),
    lon: z.number().gte(-180).lte(180),
    lat: z.number().gte(-90).lte(90),
  }),
  z.object({
    action: z.literal('clear_pin'),
    place: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'expected a JSON body' },
      { status: 400 }
    );
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (parsed.data.action === 'prioritize_photo') {
    const uuid = placeUuidOf(parsed.data.place);
    if (!uuid) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    const { source, file, prioritized } = parsed.data;
    const updated = await pool.query(
      `UPDATE fl_photos
          SET prioritized = $4
        WHERE place_uuid = $1 AND source = $2 AND file = $3`,
      [uuid, source, file, prioritized]
    );
    if (!updated.rowCount) {
      return NextResponse.json(
        { error: 'unknown photograph' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, prioritized });
  }
  if (parsed.data.action === 'uninteresting') {
    const uuid = placeUuidOf(parsed.data.place);
    if (!uuid) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    const uid = await uidOf(request);
    if (!uid) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    if (parsed.data.uninteresting) {
      await pool.query(
        `INSERT INTO fl_uninteresting (place_uuid, flagged_by)
         VALUES ($1, $2)
         ON CONFLICT (place_uuid) DO NOTHING`,
        [uuid, uid]
      );
    } else {
      await pool.query(`DELETE FROM fl_uninteresting WHERE place_uuid = $1`, [
        uuid,
      ]);
    }
    return NextResponse.json({
      ok: true,
      uninteresting: parsed.data.uninteresting,
    });
  }
  if (parsed.data.action === 'set_pin' || parsed.data.action === 'clear_pin') {
    const uuid = placeUuidOf(parsed.data.place);
    if (!uuid) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    const uid = await uidOf(request);
    if (!uid) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    if (parsed.data.action === 'clear_pin') {
      await pool.query(`DELETE FROM fl_pin_overrides WHERE place_uuid = $1`, [
        uuid,
      ]);
      const coord = placeCoord(uuid);
      return NextResponse.json({
        ok: true,
        lon: coord?.[0] ?? null,
        lat: coord?.[1] ?? null,
        pin_override: null,
      });
    }
    const lon = Math.round(parsed.data.lon * 1e6) / 1e6;
    const lat = Math.round(parsed.data.lat * 1e6) / 1e6;
    await pool.query(
      `INSERT INTO fl_pin_overrides (place_uuid, lon, lat, set_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (place_uuid) DO UPDATE SET
         lon = EXCLUDED.lon,
         lat = EXCLUDED.lat,
         set_by = EXCLUDED.set_by,
         updated_at = now()`,
      [uuid, lon, lat, uid]
    );
    return NextResponse.json({
      ok: true,
      lon,
      lat,
      pin_override: { lon, lat },
    });
  }
  if (parsed.data.action === 'rate') {
    const uuid = placeUuidOf(parsed.data.place);
    if (!uuid) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    const uid = await uidOf(request);
    if (!uid) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    const { stars } = parsed.data;
    const { rows: prev } = await pool.query<{
      author: string;
      payload: { visited?: unknown };
    }>(
      `SELECT e.author, e.payload
         FROM fl_events e
         LEFT JOIN fl_account_devices d ON d.device = e.author
        WHERE e.place_uuid = $1 AND e.kind = 'rating'
          AND COALESCE(d.account, e.author) = $2
          AND NOT EXISTS (
            SELECT 1 FROM fl_events x
             WHERE x.kind = 'rating_delete'
               AND x.payload->>'target_event_id' = e.event_id::text
          )
        ORDER BY e.seq DESC
        LIMIT 1`,
      [uuid, uid]
    );
    // Same author as the rating already under this account, so the new
    // row replaces it instead of counting as a second person. No
    // client_ts: a row this server writes has to reach the phone that
    // filed the previous one, and the sync drops a device's own events
    // only when that device sent them.
    const payload: { stars: number; visited?: boolean } = { stars };
    if (typeof prev[0]?.payload?.visited === 'boolean') {
      payload.visited = prev[0].payload.visited;
    }
    await tx(async c => {
      const { rows: seq } = await c.query<{ v: string }>(
        'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v'
      );
      await c.query(
        `INSERT INTO fl_events (seq, event_id, kind, place_uuid, author, payload)
         VALUES ($1, $2, 'rating', $3, $4, $5)`,
        [
          Number(seq[0].v),
          crypto.randomUUID(),
          uuid,
          prev[0]?.author ?? uid,
          JSON.stringify(payload),
        ]
      );
    });
    return NextResponse.json({ ok: true, ...(await ratingOf(uuid, uid)) });
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

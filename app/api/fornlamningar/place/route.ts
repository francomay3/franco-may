import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/admin';
import { pool, tx } from '@/lib/db';
import { cleanPayload, publicAuthor } from '@/lib/fl-authors';
import { placeUuidOf } from '@/lib/lamning';

/**
 * One place, for the moderator: what was published there, and the register
 * text it sits on.
 *
 * The id in the query is whatever a person would type. L1997:4707 is a
 * register number; the uuid is what the phone stores. Both resolve here.
 * See lib/lamning.ts for why those are not the same string.
 */

const MODERATOR = '00000000-0000-0000-0000-000000000000';

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
  const [{ rows: comments }, { rows: pending }, { rows: published }] =
    await Promise.all([
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
        `SELECT event_id, payload, created_at
           FROM fl_photo_queue WHERE place_uuid = $1
          ORDER BY created_at`,
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
    ]);

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
    await tx(async c => {
      const { rows: already } = await c.query(
        `SELECT 1 FROM fl_events
          WHERE kind = 'photo_removed'
            AND payload->>'target_event_id' = $1`,
        [event_id]
      );
      // Read the place before the queue row is gone. A photo that never
      // left the queue still needs the removal: the uploader's phone has a
      // local row under this id and will not drop it unless one arrives.
      const { rows: place } = await c.query(
        `SELECT place_uuid FROM fl_photo_queue WHERE event_id = $1
         UNION ALL
         SELECT place_uuid FROM fl_events
          WHERE event_id = $1 AND kind = 'photo'
         LIMIT 1`,
        [event_id]
      );
      await c.query('DELETE FROM fl_photo_queue WHERE event_id = $1', [
        event_id,
      ]);
      if (already.length) return;
      const placeUuid = place[0]?.place_uuid;
      if (!placeUuid) return;
      const { rows: seq } = await c.query<{ v: string }>(
        'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v'
      );
      await c.query(
        `INSERT INTO fl_events
           (seq, event_id, kind, place_uuid, author, payload)
         VALUES ($1, $2, 'photo_removed', $3, $4, $5)`,
        [
          Number(seq[0].v),
          crypto.randomUUID(),
          placeUuid,
          MODERATOR,
          JSON.stringify({ target_event_id: event_id }),
        ]
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('photo delete failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

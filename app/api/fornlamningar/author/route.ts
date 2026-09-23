import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';
import { cleanPayload, publicAuthor } from '@/lib/fl-authors';

/**
 * One contributor, for the moderator.
 *
 * The id in the query is the pseudonym the comment list already shows, not
 * the author id. That value is a write credential -- see publicAuthor -- so
 * this route resolves the pseudonym back to the rows and never sends the
 * credential out again. A short prefix is accepted when only one person
 * matches, because the list prints eight characters.
 *
 * What comes back is what that person has said and where. Comments and
 * photos are the things they published. Places are the ones they answered
 * about: a confirmed visit, a rating, or a sign. A "no" with no visit is
 * not a place they went to and is left out.
 */

type Desc = { title?: string };

const shards = new Map<string, Record<string, Desc>>();

function placeTitle(uuid: string): string | null {
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
  return bag[uuid]?.title ?? null;
}

const HEX = /^[0-9a-f]{8,32}$/i;

async function resolveAuthors(pub: string): Promise<string[] | null> {
  const { rows } = await pool.query<{ author: string }>(
    `SELECT DISTINCT author FROM fl_events
     UNION
     SELECT DISTINCT author FROM fl_photo_queue`
  );
  const want = pub.toLowerCase();
  const hits: string[] = [];
  for (const row of rows) {
    const hash = await publicAuthor(row.author);
    if (!hash) return null;
    if (hash === want || (want.length < 32 && hash.startsWith(want))) {
      hits.push(row.author);
    }
  }
  return hits;
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!HEX.test(id)) {
    return NextResponse.json({ error: 'bad id' }, { status: 400 });
  }

  let authors: string[] | null;
  try {
    authors = await resolveAuthors(id);
  } catch (e) {
    console.error('author lookup failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
  if (authors === null) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
  if (authors.length !== 1) {
    return NextResponse.json(
      { error: authors.length ? 'ambiguous' : 'not found' },
      { status: authors.length ? 409 : 404 }
    );
  }
  const author = authors[0];
  const shown = await publicAuthor(author);
  if (!shown) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }

  try {
    const [
      { rows: comments },
      { rows: photos },
      { rows: queued },
      { rows: answers },
    ] = await Promise.all([
      pool.query(
        `SELECT c.event_id, c.place_uuid, c.payload, c.server_ts,
                  r.server_ts AS removed_at
             FROM fl_events c
             LEFT JOIN fl_events r
                    ON r.kind = 'comment_removed'
                   AND r.payload->>'target_event_id' = c.event_id::text
            WHERE c.author = $1 AND c.kind = 'comment'
            ORDER BY c.seq DESC
            LIMIT 80`,
        [author]
      ),
      pool.query(
        `SELECT e.event_id, e.place_uuid, e.server_ts
             FROM fl_events e
            WHERE e.author = $1 AND e.kind = 'photo'
              AND NOT EXISTS (
                SELECT 1 FROM fl_events r
                 WHERE r.kind = 'photo_removed'
                   AND r.payload->>'target_event_id' = e.event_id::text
              )
            ORDER BY e.seq DESC`,
        [author]
      ),
      pool.query(
        `SELECT q.event_id, q.place_uuid, q.created_at
             FROM fl_photo_queue q
            WHERE q.author = $1
              AND NOT EXISTS (
                SELECT 1 FROM fl_events r
                 WHERE r.kind = 'photo_removed'
                   AND r.payload->>'target_event_id' = q.event_id::text
              )
            ORDER BY q.created_at DESC`,
        [author]
      ),
      pool.query(
        `SELECT DISTINCT ON (place_uuid, kind)
                  kind, place_uuid, payload, server_ts
             FROM fl_events
            WHERE author = $1
              AND kind IN ('presence', 'visit', 'rating', 'sign')
            ORDER BY place_uuid, kind, seq DESC`,
        [author]
      ),
    ]);

    const { rows: commentCount } = await pool.query<{ n: string }>(
      `SELECT count(*)::int AS n FROM fl_events
        WHERE author = $1 AND kind = 'comment'`,
      [author]
    );

    type Place = {
      place_uuid: string;
      title: string | null;
      been: boolean | null;
      stars: number | null;
      not_found: boolean;
      sign: string | null;
      last_at: string;
    };
    const places = new Map<string, Place>();
    const touch = (uuid: string, at: Date) => {
      let row = places.get(uuid);
      if (!row) {
        row = {
          place_uuid: uuid,
          title: placeTitle(uuid),
          been: null,
          stars: null,
          not_found: false,
          sign: null,
          last_at: at.toISOString(),
        };
        places.set(uuid, row);
      }
      if (at.toISOString() > row.last_at) row.last_at = at.toISOString();
      return row;
    };

    for (const r of answers) {
      const at = new Date(r.server_ts);
      const payload = cleanPayload(r.payload);
      if (r.kind === 'visit') {
        touch(r.place_uuid, at).been = true;
      } else if (r.kind === 'presence') {
        const row = touch(r.place_uuid, at);
        if (payload.been === true) row.been = true;
        else if (payload.been === false && row.been !== true) row.been = false;
      } else if (r.kind === 'rating') {
        const row = touch(r.place_uuid, at);
        if (payload.not_found === true) row.not_found = true;
        else if (typeof payload.stars === 'number') row.stars = payload.stars;
      } else if (r.kind === 'sign' && typeof payload.answer === 'string') {
        touch(r.place_uuid, at).sign = payload.answer;
      }
    }

    const placeList = [...places.values()]
      .filter(p => p.been === true || p.stars !== null || p.not_found || p.sign)
      .sort((a, b) => (a.last_at < b.last_at ? 1 : -1));

    return NextResponse.json({
      id: shown,
      comments: {
        total: Number(commentCount[0]?.n ?? comments.length),
        items: comments.map(r => ({
          event_id: r.event_id,
          place_uuid: r.place_uuid,
          title: placeTitle(r.place_uuid),
          body: (cleanPayload(r.payload).body as string) ?? '',
          created_at: new Date(r.server_ts).toISOString(),
          removed_at: r.removed_at
            ? new Date(r.removed_at).toISOString()
            : null,
        })),
      },
      photos: [
        ...queued.map(r => ({
          event_id: r.event_id,
          place_uuid: r.place_uuid,
          title: placeTitle(r.place_uuid),
          status: 'pending' as const,
          created_at: new Date(r.created_at).toISOString(),
        })),
        ...photos.map(r => ({
          event_id: r.event_id,
          place_uuid: r.place_uuid,
          title: placeTitle(r.place_uuid),
          status: 'published' as const,
          created_at: new Date(r.server_ts).toISOString(),
        })),
      ],
      places: placeList.slice(0, 120),
      places_total: placeList.length,
    });
  } catch (e) {
    console.error('author read failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

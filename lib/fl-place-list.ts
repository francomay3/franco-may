import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '@/lib/db';

/**
 * One row per place the admin list can show.
 *
 * The name and the photo count come from the published descriptions, which
 * is the set of places that have a page. A place with no description still
 * appears when somebody has rated it, commented, sent a photo, or when a
 * source was stored for it -- otherwise sorting by those columns would hide
 * the only rows that make the column worth having.
 *
 * Photos are the pictures published with the description. Uploads are the
 * ones a visitor sent, waiting or already on the place. They are different
 * piles, and a single total would make a place with six archive pictures
 * look like a place where six people sent one.
 */

export type PlaceRow = {
  id: string;
  name: string;
  photos: number;
  uploads: number;
  sources: number;
  rating: number | null;
  votes: number;
  comments: number;
};

type Desc = { title?: string; images?: unknown };

let published: Map<string, { name: string; photos: number }> | null = null;

function publishedPlaces() {
  if (published) {
    return published;
  }
  const dir = join(process.cwd(), 'public', 'descriptions');
  const map = new Map<string, { name: string; photos: number }>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const bag = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<
      string,
      Desc
    >;
    for (const [id, desc] of Object.entries(bag)) {
      map.set(id, {
        name: desc.title?.trim() || '',
        photos: Array.isArray(desc.images) ? desc.images.length : 0,
      });
    }
  }
  published = map;
  return map;
}

function blank(id: string, name = '', photos = 0): PlaceRow {
  return {
    id,
    name,
    photos,
    uploads: 0,
    sources: 0,
    rating: null,
    votes: 0,
    comments: 0,
  };
}

type Count = { place_uuid: string; n: string };
type Rated = { place_uuid: string; rating: string; votes: string };

export async function placeRows(): Promise<PlaceRow[]> {
  const byId = new Map<string, PlaceRow>();
  for (const [id, desc] of publishedPlaces()) {
    byId.set(id, blank(id, desc.name, desc.photos));
  }
  const ensure = (id: string) => {
    let row = byId.get(id);
    if (!row) {
      row = blank(id);
      byId.set(id, row);
    }
    return row;
  };

  const [sources, ratings, comments, uploads] = await Promise.all([
    pool.query<Count>(
      `SELECT place_uuid, count(*) AS n
         FROM (
           SELECT place_uuid FROM fl_sources
           UNION ALL
           SELECT a.place_uuid
             FROM fl_sources_added a
            WHERE a.removed_at IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM fl_sources s
                 WHERE s.place_uuid = a.place_uuid
                   AND a.url IS NOT NULL
                   AND s.url = a.url
              )
         ) src
        GROUP BY place_uuid`
    ),
    pool.query<Rated>(
      `SELECT e.place_uuid,
              round(avg((e.payload->>'stars')::numeric), 2) AS rating,
              count(*) AS votes
         FROM fl_events e
        WHERE e.kind = 'rating'
          AND e.payload ? 'stars'
          AND NOT EXISTS (
            SELECT 1 FROM fl_events d
             WHERE d.kind = 'rating_delete'
               AND d.payload->>'target_event_id' = e.event_id::text
          )
        GROUP BY e.place_uuid`
    ),
    pool.query<Count>(
      `SELECT c.place_uuid, count(*) AS n
         FROM fl_events c
        WHERE c.kind = 'comment'
          AND NOT EXISTS (
            SELECT 1 FROM fl_events d
             WHERE d.kind IN ('comment_delete', 'comment_removed')
               AND d.payload->>'target_event_id' = c.event_id::text
          )
        GROUP BY c.place_uuid`
    ),
    pool.query<Count>(
      `SELECT place_uuid, count(*) AS n
         FROM (
           SELECT e.place_uuid
             FROM fl_events e
            WHERE e.kind = 'photo'
              AND NOT EXISTS (
                SELECT 1 FROM fl_events r
                 WHERE r.kind = 'photo_removed'
                   AND r.payload->>'target_event_id' = e.event_id::text
              )
           UNION ALL
           SELECT q.place_uuid
             FROM fl_photo_queue q
            WHERE NOT EXISTS (
              SELECT 1 FROM fl_events r
               WHERE r.kind = 'photo_removed'
                 AND r.payload->>'target_event_id' = q.event_id::text
            )
         ) pics
        GROUP BY place_uuid`
    ),
  ]);

  for (const r of sources.rows) {
    ensure(r.place_uuid).sources = Number(r.n);
  }
  for (const r of ratings.rows) {
    const row = ensure(r.place_uuid);
    row.rating = Number(r.rating);
    row.votes = Number(r.votes);
  }
  for (const r of comments.rows) {
    ensure(r.place_uuid).comments = Number(r.n);
  }
  for (const r of uploads.rows) {
    ensure(r.place_uuid).uploads = Number(r.n);
  }

  return [...byId.values()];
}

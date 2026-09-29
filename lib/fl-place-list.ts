import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import { pool } from '@/lib/db';

/**
 * One row per place the admin list can show.
 *
 * The name comes from the published descriptions, which is the set of places
 * that have a page. A place with no description still appears when somebody
 * has rated it, commented, sent a photo, or when a source was stored for it
 * -- otherwise sorting by those columns would hide the only rows that make
 * the column worth having.
 *
 * Photos are every picture on the place: the archive photographs shipped
 * with the description, plus the ones a visitor sent. The deployed
 * description JSON does not carry the archive list -- that rides in the
 * English descriptions database -- so a count taken from the JSON alone is
 * zero for every row.
 *
 * Rating is the visitors' mean, the same number the app draws once anyone
 * has answered, and `votes` is how many gave a score. Estimate is the app's
 * own 1-5 stars, which is what the sheet shows until that first answer.
 */

export type PlaceRow = {
  id: string;
  name: string;
  photos: number;
  sources: number;
  rating: number | null;
  votes: number;
  estimate: number | null;
  comments: number;
};

type Desc = { title?: string; images?: unknown };

let published: Map<string, { name: string; photos: number | null }> | null =
  null;
let archiveFromDb: Map<string, number> | null = null;
let modelStars: Map<string, number> | null = null;

function publishedPlaces() {
  if (published) {
    return published;
  }
  const dir = join(process.cwd(), 'public', 'descriptions');
  const map = new Map<string, { name: string; photos: number | null }>();
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
        // Absent means the file never carried pictures, not that there are
        // none. The database fills those in.
        photos: Array.isArray(desc.images) ? desc.images.length : null,
      });
    }
  }
  published = map;
  return map;
}

function picturesInDb(): Map<string, number> {
  if (archiveFromDb) {
    return archiveFromDb;
  }
  const map = new Map<string, number>();
  const path = join(process.cwd(), 'data', 'descriptions.en.db');
  if (!existsSync(path)) {
    archiveFromDb = map;
    return map;
  }
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const rows = db
      .prepare(
        `SELECT uuid, images FROM descriptions
          WHERE images IS NOT NULL AND images <> ''`
      )
      .all() as { uuid: string; images: string }[];
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.images) as unknown;
        if (Array.isArray(parsed)) {
          map.set(row.uuid, parsed.length);
        }
      } catch {
        // A row that will not parse is a row with no pictures to count.
      }
    }
  } finally {
    db.close();
  }
  archiveFromDb = map;
  return map;
}

function appStars(): Map<string, number> {
  if (modelStars) {
    return modelStars;
  }
  const map = new Map<string, number>();
  const root = join(process.cwd(), 'public', 'tiles', '14');
  if (!existsSync(root)) {
    modelStars = map;
    return map;
  }
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!name.endsWith('.pbf')) {
        continue;
      }
      const tile = new VectorTile(new Pbf(readFileSync(path)));
      const layer = tile.layers.archaeological_sites;
      if (!layer) {
        continue;
      }
      for (let i = 0; i < layer.length; i++) {
        const props = layer.feature(i).properties;
        if (typeof props.uuid === 'string' && typeof props.stars === 'number') {
          map.set(props.uuid, props.stars);
        }
      }
    }
  };
  walk(root);
  modelStars = map;
  return map;
}

function blank(id: string, name = ''): PlaceRow {
  return {
    id,
    name,
    photos: 0,
    sources: 0,
    rating: null,
    votes: 0,
    estimate: null,
    comments: 0,
  };
}

type Count = { place_uuid: string; n: string };
type Rated = { place_uuid: string; rating: string; votes: string };

export async function placeRows(): Promise<PlaceRow[]> {
  const pictures = picturesInDb();
  const stars = appStars();
  const byId = new Map<string, PlaceRow>();
  for (const [id, desc] of publishedPlaces()) {
    const row = blank(id, desc.name);
    row.photos = desc.photos ?? pictures.get(id) ?? 0;
    row.estimate = stars.get(id) ?? null;
    byId.set(id, row);
  }
  const ensure = (id: string) => {
    let row = byId.get(id);
    if (!row) {
      row = blank(id);
      row.photos = pictures.get(id) ?? 0;
      row.estimate = stars.get(id) ?? null;
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
      `SELECT place_uuid,
              round(avg(stars), 2) AS rating,
              count(stars) AS votes
         FROM (
           SELECT DISTINCT ON (e.place_uuid, e.author)
                  e.place_uuid,
                  CASE WHEN e.payload ? 'stars'
                       THEN (e.payload->>'stars')::numeric
                  END AS stars
             FROM fl_events e
            WHERE e.kind = 'rating'
              AND NOT EXISTS (
                SELECT 1 FROM fl_events d
                 WHERE d.kind = 'rating_delete'
                   AND d.payload->>'target_event_id' = e.event_id::text
              )
            ORDER BY e.place_uuid, e.author, e.seq DESC
         ) latest
        GROUP BY place_uuid
       HAVING count(stars) > 0`
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
    ensure(r.place_uuid).photos += Number(r.n);
  }

  return [...byId.values()];
}

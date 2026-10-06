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
 * Photos are every photograph held for the place, in fl_photos, plus the
 * ones a visitor sent. The app still receives at most six of the archive.
 * Until that catalog is loaded, the count falls back to the pictures the
 * description shipped.
 *
 * Rating is the visitors' mean, the same number the app draws once anyone
 * has answered, and `votes` is how many gave a score. Score is where the
 * place sits after the comparison model reorders the top 6 000: 100 is
 * first, and a place outside that list has none. Estimate is the star
 * band from that same order.
 */

export type PlaceRow = {
  id: string;
  name: string;
  /** Register type, the lämningstyp, when the tile has one. */
  kind: string;
  /** The app's filter group for that type: graves, forts, rockart, … */
  family: string;
  photos: number;
  /** At least one archive photograph marked prioritized. */
  prioritized: boolean;
  /** Marked not worth the trip. The pipeline trains against these. */
  uninteresting: boolean;
  /** When the place was signed off in the admin. */
  verified_at: string | null;
  sources: number;
  rating: number | null;
  votes: number;
  /**
   * Percentile of the post-6k order (stars, then the comparison score).
   * 100 is first. Null when the place is outside the top 6 000.
   */
  score: number | null;
  estimate: number | null;
  comments: number;
};

type Desc = { title?: string; images?: unknown };

let published: Map<string, { name: string; photos: number | null }> | null =
  null;
let archiveFromDb: Map<string, number> | null = null;
type TileInfo = {
  stars: number | null;
  kind: string;
  family: string;
  /** Percentile of the post-6k order. 100 is first. */
  score: number | null;
};

let tileCache: Map<string, TileInfo> | null = null;

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

/**
 * pbf reads floats from a DataView of the underlying ArrayBuffer and ignores
 * a Buffer's byteOffset. Node's file reads are often slices of a pool, so
 * the score float comes back as garbage unless the bytes start at offset 0.
 * Stars and strings are varints and were never affected.
 */
function tileBytes(path: string): Uint8Array {
  const raw = readFileSync(path);
  if (raw.byteOffset === 0) {
    return new Uint8Array(raw.buffer, 0, raw.byteLength);
  }
  const copy = new Uint8Array(raw.byteLength);
  copy.set(raw);
  return copy;
}

function tiles(): Map<string, TileInfo> {
  if (tileCache) {
    return tileCache;
  }
  const map = new Map<string, TileInfo>();
  const root = join(process.cwd(), 'public', 'tiles', '14');
  if (!existsSync(root)) {
    tileCache = map;
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
      const tile = new VectorTile(new Pbf(tileBytes(path)));
      const layer = tile.layers.archaeological_sites;
      if (!layer) {
        continue;
      }
      for (let i = 0; i < layer.length; i++) {
        const props = layer.feature(i).properties;
        if (typeof props.uuid !== 'string') {
          continue;
        }
        const prev = map.get(props.uuid);
        const score = props.score;
        map.set(props.uuid, {
          stars:
            typeof props.stars === 'number'
              ? props.stars
              : (prev?.stars ?? null),
          kind:
            typeof props.class === 'string' && props.class
              ? props.class
              : (prev?.kind ?? ''),
          family:
            typeof props.family === 'string' && props.family
              ? props.family
              : (prev?.family ?? ''),
          score:
            typeof score === 'number' && Number.isFinite(score)
              ? score
              : (prev?.score ?? null),
        });
      }
    }
  };
  walk(root);
  tileCache = map;
  return map;
}

function blank(id: string, name = ''): PlaceRow {
  return {
    id,
    name,
    kind: '',
    family: '',
    photos: 0,
    prioritized: false,
    uninteresting: false,
    verified_at: null,
    sources: 0,
    rating: null,
    votes: 0,
    score: null,
    estimate: null,
    comments: 0,
  };
}

type Count = { place_uuid: string; n: string };
type Rated = { place_uuid: string; rating: string; votes: string };
type HeldRow = { place_uuid: string; n: string; marked: string };
type Held = { n: number; marked: number };

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

async function photoCounts(): Promise<Map<string, Held> | null> {
  try {
    const { rows } = await pool.query<HeldRow>(
      `SELECT place_uuid,
              count(*) AS n,
              count(*) FILTER (WHERE prioritized) AS marked
         FROM fl_photos
        GROUP BY place_uuid`
    );
    return new Map(
      rows.map(r => [
        r.place_uuid,
        { n: Number(r.n), marked: Number(r.marked) },
      ])
    );
  } catch (err) {
    if (missingTable(err)) {
      return null;
    }
    throw err;
  }
}

async function verifiedAt(): Promise<Map<string, string>> {
  try {
    const { rows } = await pool.query<{
      place_uuid: string;
      verified_at: Date;
    }>(`SELECT place_uuid, verified_at FROM fl_verified`);
    return new Map(
      rows.map(r => [r.place_uuid, new Date(r.verified_at).toISOString()])
    );
  } catch (err) {
    if (missingTable(err)) {
      return new Map();
    }
    throw err;
  }
}

async function uninterestingIds(): Promise<Set<string>> {
  try {
    const { rows } = await pool.query<{ place_uuid: string }>(
      `SELECT place_uuid FROM fl_uninteresting`
    );
    return new Set(rows.map(r => r.place_uuid));
  } catch (err) {
    if (missingTable(err)) {
      return new Set();
    }
    throw err;
  }
}

export async function placeRows(): Promise<PlaceRow[]> {
  const pictures = picturesInDb();
  const tile = tiles();
  const [held, dull, signed] = await Promise.all([
    photoCounts(),
    uninterestingIds(),
    verifiedAt(),
  ]);
  const byId = new Map<string, PlaceRow>();
  const fill = (row: PlaceRow, shipped: number | null) => {
    const info = held?.get(row.id);
    const fromTile = tile.get(row.id);
    row.photos = info ? info.n : (shipped ?? pictures.get(row.id) ?? 0);
    row.prioritized = (info?.marked ?? 0) > 0;
    row.uninteresting = dull.has(row.id);
    row.verified_at = signed.get(row.id) ?? null;
    row.kind = fromTile?.kind ?? '';
    row.family = fromTile?.family ?? '';
    row.score = fromTile?.score ?? null;
    row.estimate = fromTile?.stars ?? null;
  };
  for (const [id, desc] of publishedPlaces()) {
    const row = blank(id, desc.name);
    fill(row, desc.photos);
    byId.set(id, row);
  }
  const ensure = (id: string) => {
    let row = byId.get(id);
    if (!row) {
      row = blank(id);
      fill(row, null);
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

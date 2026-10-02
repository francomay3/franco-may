import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { pool } from '@/lib/db';
import { placeUuidOf } from '@/lib/lamning';
import { placeCoord } from '@/lib/place-coords';

/**
 * Add a Commons photograph to one place, or take one back.
 *
 * Two ways in. Pasting a file is a person saying this picture is the
 * place, so it is stored as `hand` and prioritized: the app will ship it
 * once the pipeline has read the export. Searching nearby is the one-place
 * version of crawl_wikimedia.fetch_nearby -- Commons geosearch, 500 m, one
 * page of results. Those land as `geosearch` and stay out of the app until
 * someone prioritizes one, which is the rule that source already has.
 *
 * Rows go in fl_photos_added, not fl_photos. The catalog load replaces
 * fl_photos, and a photograph written only there would not survive it.
 */

const UA = 'fornkoll/1.0 (https://franco-may.com)';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
/** Same radius and page size as crawl_wikimedia.fetch_nearby. */
const RADIUS_M = 500;
const NEARBY_LIMIT = 24;

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    place: z.string().min(1),
    file: z.string().trim().min(1).max(2000),
  }),
  z.object({
    action: z.literal('nearby'),
    place: z.string().min(1),
  }),
  z.object({
    action: z.literal('remove'),
    place: z.string().min(1),
    source: z.string().min(1).max(64),
    file: z.string().min(1).max(2000),
  }),
]);

type CommonsFile = {
  file: string;
  thumb: string;
  page: string | null;
  author: string | null;
  licence: string | null;
  licence_url: string | null;
  image_url: string | null;
  width: number | null;
  height: number | null;
};

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

/** A Commons file page, a File: title, or a Special:FilePath link. */
function fileTitle(raw: string): string | null {
  const s = raw.trim();
  let name: string | null = null;
  try {
    const url = new URL(s);
    if (!/(^|\.)commons\.wikimedia\.org$/i.test(url.hostname)) {
      return null;
    }
    const path = decodeURIComponent(url.pathname);
    const file = path.match(/^\/wiki\/(?:File:|Special:FilePath\/)(.+)$/i);
    name = file ? file[1] : null;
  } catch {
    const bare = s.match(/^file:(.+)$/i);
    name = bare ? bare[1] : null;
  }
  if (!name) {
    return null;
  }
  // MediaWiki treats underscores as spaces in a title.
  name = name.replace(/_/g, ' ').trim();
  if (!name || name.length > 240) {
    return null;
  }
  return `File:${name}`;
}

function apiError(json: Record<string, unknown>): string | null {
  const err = json.error;
  if (!err) {
    return null;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err === 'object' && 'info' in err) {
    const info = (err as { info?: unknown }).info;
    if (typeof info === 'string') {
      return info;
    }
  }
  return 'Commons rejected the request';
}

function plain(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const text = value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, 300) : null;
}

async function commons(
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const api = new URL(COMMONS);
  api.searchParams.set('format', 'json');
  api.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) {
    api.searchParams.set(k, v);
  }
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    return { error: `Commons answered ${res.status}` };
  }
  return (await res.json()) as Record<string, unknown>;
}

function filesFrom(json: Record<string, unknown>): CommonsFile[] {
  const pages = (json.query as { pages?: unknown } | undefined)?.pages;
  if (!Array.isArray(pages)) {
    return [];
  }
  const out: CommonsFile[] = [];
  for (const page of pages) {
    if (!page || typeof page !== 'object') {
      continue;
    }
    const p = page as {
      title?: string;
      missing?: boolean;
      imageinfo?: {
        thumburl?: string;
        url?: string;
        descriptionurl?: string;
        width?: number;
        height?: number;
        mime?: string;
        extmetadata?: Record<string, { value?: string }>;
      }[];
    };
    const info = p.imageinfo?.[0];
    const title = p.title;
    if (!title || p.missing || !info) {
      continue;
    }
    if (info.mime && !info.mime.startsWith('image/')) {
      continue;
    }
    const thumb = info.thumburl || info.url;
    if (!thumb) {
      continue;
    }
    const meta = info.extmetadata;
    out.push({
      file: title,
      thumb,
      page: info.descriptionurl ?? null,
      author: plain(meta?.Artist?.value),
      licence: plain(meta?.LicenseShortName?.value),
      licence_url: plain(meta?.LicenseUrl?.value),
      image_url: info.url ?? null,
      width: typeof info.width === 'number' ? info.width : null,
      height: typeof info.height === 'number' ? info.height : null,
    });
  }
  return out;
}

async function lookup(titles: string[]): Promise<CommonsFile[] | { error: string }> {
  const groups: string[][] = [];
  let batch: string[] = [];
  const flush = () => {
    if (batch.length) {
      groups.push(batch);
      batch = [];
    }
  };
  for (const title of titles) {
    if (title.includes('|')) {
      flush();
      groups.push([title]);
      continue;
    }
    batch.push(title);
    if (batch.length === 20) {
      flush();
    }
  }
  flush();
  const out: CommonsFile[] = [];
  for (const group of groups) {
    const json = await commons({
      action: 'query',
      titles: group.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: '640',
    });
    const failed = apiError(json);
    if (failed) {
      return { error: failed };
    }
    out.push(...filesFrom(json));
  }
  return out;
}

async function held(uuid: string): Promise<Set<string>> {
  const [catalog, added] = await Promise.all([
    pool
      .query<{ file: string }>(
        `SELECT file FROM fl_photos WHERE place_uuid = $1`,
        [uuid]
      )
      .catch(err => {
        if (missingTable(err)) {
          return { rows: [] as { file: string }[] };
        }
        throw err;
      }),
    pool
      .query<{ file: string }>(
        `SELECT file FROM fl_photos_added WHERE place_uuid = $1`,
        [uuid]
      )
      .catch(err => {
        if (missingTable(err)) {
          return { rows: [] as { file: string }[] };
        }
        throw err;
      }),
  ]);
  return new Set(
    [...catalog.rows, ...added.rows].map(r => r.file.toLowerCase())
  );
}

async function insertPhoto(
  uuid: string,
  uid: string,
  source: 'hand' | 'geosearch',
  file: CommonsFile,
  distance: number | null,
  prioritized: boolean
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `INSERT INTO fl_photos_added
       (place_uuid, source, file, thumb, page, author, licence, licence_url,
        image_url, width, height, distance_m, added_by, prioritized)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (place_uuid, source, file) DO NOTHING`,
    [
      uuid,
      source,
      file.file,
      file.thumb,
      file.page,
      file.author,
      file.licence,
      file.licence_url,
      file.image_url,
      file.width,
      file.height,
      distance,
      uid,
      prioritized,
    ]
  );
  return (rowCount ?? 0) > 0;
}

async function coordOf(
  uuid: string
): Promise<{ lon: number; lat: number } | null> {
  const pin = await pool
    .query<{ lon: number; lat: number }>(
      `SELECT lon, lat FROM fl_pin_overrides WHERE place_uuid = $1`,
      [uuid]
    )
    .then(r => r.rows[0] ?? null)
    .catch(err => {
      if (missingTable(err)) {
        return null;
      }
      throw err;
    });
  if (pin) {
    return { lon: Number(pin.lon), lat: Number(pin.lat) };
  }
  const coord = placeCoord(uuid);
  if (!coord) {
    return null;
  }
  return { lon: coord[0], lat: coord[1] };
}

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
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const uuid = placeUuidOf(parsed.data.place);
  if (!uuid) {
    return NextResponse.json({ error: 'no place with that id' }, { status: 404 });
  }

  if (parsed.data.action === 'remove') {
    const source =
      parsed.data.source === 'commons_hand'
        ? 'hand'
        : parsed.data.source === 'commons_geosearch'
          ? 'geosearch'
          : null;
    if (!source) {
      return NextResponse.json(
        { error: 'only a photograph added here can be removed' },
        { status: 400 }
      );
    }
    const { rowCount } = await pool.query(
      `UPDATE fl_photos_added SET removed_at = now()
        WHERE place_uuid = $1 AND source = $2 AND file = $3
          AND removed_at IS NULL`,
      [uuid, source, parsed.data.file]
    );
    if (!rowCount) {
      return NextResponse.json(
        { error: 'unknown photograph' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === 'add') {
    const title = fileTitle(parsed.data.file);
    if (!title) {
      return NextResponse.json(
        {
          error:
            'Paste a Commons file link, or a title that starts with File:',
        },
        { status: 422 }
      );
    }
    const found = await lookup([title]);
    if ('error' in found) {
      return NextResponse.json({ error: found.error }, { status: 502 });
    }
    const file = found[0];
    if (!file) {
      return NextResponse.json(
        { error: 'Commons has no image by that name' },
        { status: 422 }
      );
    }
    const inCatalog = await pool
      .query(
        `SELECT 1 FROM fl_photos WHERE place_uuid = $1 AND lower(file) = lower($2)`,
        [uuid, file.file]
      )
      .then(r => r.rows.length > 0)
      .catch(err => {
        if (missingTable(err)) {
          return false;
        }
        throw err;
      });
    const active = await pool
      .query(
        `SELECT 1 FROM fl_photos_added
          WHERE place_uuid = $1 AND lower(file) = lower($2)
            AND removed_at IS NULL`,
        [uuid, file.file]
      )
      .then(r => r.rows.length > 0)
      .catch(err => {
        if (missingTable(err)) {
          return false;
        }
        throw err;
      });
    if (inCatalog || active) {
      return NextResponse.json(
        { error: 'That photograph is already in the drawer' },
        { status: 422 }
      );
    }
    // Pasting a file that was taken back puts that same hand-added row
    // in the drawer again, still prioritized.
    const restored = await pool.query(
      `UPDATE fl_photos_added
          SET removed_at = NULL, thumb = $3, page = $4, author = $5,
              licence = $6, licence_url = $7, image_url = $8, width = $9,
              height = $10, prioritized = true, skipped = false
        WHERE place_uuid = $1 AND source = 'hand' AND lower(file) = lower($2)
          AND removed_at IS NOT NULL`,
      [
        uuid,
        file.file,
        file.thumb,
        file.page,
        file.author,
        file.licence,
        file.licence_url,
        file.image_url,
        file.width,
        file.height,
      ]
    );
    if (restored.rowCount) {
      return NextResponse.json({ ok: true, file: file.file });
    }
    // A hand-added file is the person saying this is the place, so it
    // starts prioritized. The nearby search does not: that source ships
    // only when someone marks it.
    await insertPhoto(uuid, uid, 'hand', file, null, true);
    return NextResponse.json({ ok: true, file: file.file });
  }

  const coord = await coordOf(uuid);
  if (!coord) {
    return NextResponse.json(
      { error: 'This place has no coordinate' },
      { status: 422 }
    );
  }
  const json = await commons({
    action: 'query',
    list: 'geosearch',
    gscoord: `${coord.lat}|${coord.lon}`,
    gsradius: String(RADIUS_M),
    gslimit: String(NEARBY_LIMIT),
    gsnamespace: '6',
  });
  const failed = apiError(json);
  if (failed) {
    return NextResponse.json({ error: failed }, { status: 502 });
  }
  const hits = (
    (
      json['query'] as
        | { geosearch?: { title?: string; dist?: number }[] }
        | undefined
    )?.geosearch ?? []
  ).flatMap(hit =>
    hit.title ? [{ title: hit.title, dist: hit.dist ?? null }] : []
  );
  const known = await held(uuid);
  const fresh = hits.filter(hit => !known.has(hit.title.toLowerCase()));
  const found = fresh.length ? await lookup(fresh.map(hit => hit.title)) : [];
  if ('error' in found) {
    return NextResponse.json({ error: found.error }, { status: 502 });
  }
  const distOf = new Map(fresh.map(hit => [hit.title, hit.dist]));
  let added = 0;
  for (const file of found) {
    const wrote = await insertPhoto(
      uuid,
      uid,
      'geosearch',
      file,
      distOf.get(file.file) ?? null,
      false
    );
    if (wrote) {
      added += 1;
    }
  }
  return NextResponse.json({
    ok: true,
    found: hits.length,
    added,
    already: hits.length - fresh.length,
  });
}

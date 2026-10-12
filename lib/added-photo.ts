/**
 * The photographs an admin added, in the shape the phone already renders.
 *
 * The catalog of six that ships inside the app is chosen by the pipeline.
 * This is the other list: rows in fl_photos_added that are allowed onto a
 * phone before that run. A pasted file and a Commons link someone chose
 * ship immediately. A nearby guess ships only once it is prioritized and
 * a licence is known, which is the rule build_places.py already applies
 * when it marks a row usable.
 *
 * At most six per place, and the caller has already ordered them with the
 * prioritized ones first. A seventh is dropped here rather than on the
 * phone, so the payload cannot grow past the cap the sheet uses.
 */

const MAX_PER_PLACE = 6;
const CREDIT_MAX = 120;

const THUMB = /\/commons\/thumb\/([0-9a-f]\/[0-9a-f]{2})\/([^/]+)\/(\d+)px-/i;
const FULL = /\/commons\/([0-9a-f]\/[0-9a-f]{2})\/([^/?]+)/i;

export type AddedPhotoRow = {
  place_uuid: string;
  file: string;
  thumb: string | null;
  page: string | null;
  author: string | null;
  licence: string | null;
  licence_url: string | null;
  image_url: string | null;
};

export type ShippedPhoto = {
  place: string;
  /** Carousel key. The Commons filename when we could read one, else `file`. */
  f: string;
  /** Two-level Commons hash. Absent when `src` is a finished URL. */
  h?: string;
  w?: number;
  src?: string;
  by?: string;
  lic?: string;
  licurl?: string;
  page?: string;
};

function credit(row: AddedPhotoRow, photo: ShippedPhoto): ShippedPhoto {
  const by = row.author?.trim();
  const lic = row.licence?.trim();
  const licurl = row.licence_url?.trim();
  const page = row.page?.trim();
  if (by) {
    photo.by = by.slice(0, CREDIT_MAX);
  }
  if (lic) {
    photo.lic = lic;
  }
  if (licurl) {
    photo.licurl = licurl;
  }
  if (page) {
    photo.page = page;
  }
  return photo;
}

/** One row, or null when there is no URL a phone can request. */
export function shipPhoto(row: AddedPhotoRow): ShippedPhoto | null {
  const thumb = row.thumb ?? '';
  const image = row.image_url ?? '';
  const hashed = THUMB.exec(thumb) ?? THUMB.exec(image);
  if (hashed) {
    return credit(row, {
      place: row.place_uuid,
      f: hashed[2],
      h: hashed[1],
      w: Number(hashed[3]),
    });
  }
  const plain = FULL.exec(thumb) ?? FULL.exec(image);
  if (plain) {
    return credit(row, {
      place: row.place_uuid,
      f: plain[2],
      h: plain[1],
    });
  }
  const src = image || thumb;
  if (!src || !row.file) {
    return null;
  }
  return credit(row, { place: row.place_uuid, f: row.file, src });
}

/**
 * Cap each place at six. Rows must already be in ship order: prioritized
 * first, then oldest. A place's later rows fill whatever the cap left.
 */
export function shipPhotos(rows: readonly AddedPhotoRow[]): ShippedPhoto[] {
  const used = new Map<string, number>();
  const out: ShippedPhoto[] = [];
  for (const row of rows) {
    const n = used.get(row.place_uuid) ?? 0;
    if (n >= MAX_PER_PLACE) {
      continue;
    }
    const photo = shipPhoto(row);
    if (!photo) {
      continue;
    }
    used.set(row.place_uuid, n + 1);
    out.push(photo);
  }
  return out;
}

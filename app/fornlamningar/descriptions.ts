/**
 * Descriptions are not in the vector tiles. They were 60% of every tile's
 * bytes -- the same export weighs 16.4 MB with them inline and 8.8 MB without
 * -- and it was wasted traffic: a visitor reads one description per click but
 * paid for every description in the tile on every tile fetch.
 *
 * They live in /descriptions/<first two chars of uuid>.json instead: 256
 * shards of ~28 KB. The path is derived from the uuid the feature already
 * carries, so there is no manifest to keep in sync. Keep SHARD_CHARS equal to
 * build_tiles.py's --desc-shard-chars.
 *
 * Keeping them out here also means regenerating descriptions does not
 * regenerate a single tile.
 *
 * The cache holds the in-flight promise, not the result, so several clicks in
 * the same neighbourhood before the first response share one request.
 */
const SHARD_CHARS = 2;

export type PlaceDescription = {
  /** Only present when a description was generated for this place. */
  title?: string;
  content: string;
  /** True when this is the raw, untranslated Swedish register text. */
  raw?: boolean;
  /**
   * Numbers, not prose. The pipeline already parsed these out of the Swedish
   * text, so they are kept out of the description and shown as subtext -- a
   * dolmen should not open with how many metres across it is. Units are
   * metres; formatting is this component's business.
   */
  size?: { across_m?: number; high_m?: number; area_m2?: number };
  /**
   * The one field on a pin that is not derived from the register: K-samsok
   * has no dating field and the free text names a period in under 4% of
   * entries. `basis` says where it came from -- "stated" when the register
   * itself names the period, "typology" when it follows from the site class
   * (a passage grave is Neolithic). The wording is already hedged for
   * typology ("usually Iron Age"), so it can be rendered as-is.
   */
  period?: { text: string; basis: 'stated' | 'typology' };
};

/** "23 m across · 2.7 m high" */
export function formatSize(size: PlaceDescription['size']): string | null {
  if (!size) {
    return null;
  }
  const round = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  const parts: string[] = [];
  if (size.across_m) {
    parts.push(`${round(size.across_m)} m across`);
  }
  if (size.high_m) {
    parts.push(`${round(size.high_m)} m high`);
  }
  if (!parts.length && size.area_m2) {
    parts.push(`${Math.round(size.area_m2).toLocaleString('sv-SE')} m²`);
  }
  return parts.length ? parts.join(' · ') : null;
}

const shards = new Map<string, Promise<Record<string, PlaceDescription>>>();

export function loadDescription(
  uuid: string
): Promise<PlaceDescription | null> {
  if (!uuid) {
    return Promise.resolve(null);
  }
  const key = uuid.slice(0, SHARD_CHARS).toLowerCase();

  let shard = shards.get(key);
  if (!shard) {
    shard = fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/descriptions/${key}.json`)
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    shards.set(key, shard);
  }
  return shard.then(m => m[uuid] ?? null);
}

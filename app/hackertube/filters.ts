import type { Area, Video } from './types';

/**
 * What the list is showing, and the one place that decides what it means.
 *
 * The category semantics are the ones the fornlamningar app uses, because
 * they make every checkbox binary:
 *
 *   areas       []  = every area. Non-empty = only these.
 *   categories  []  = no narrowing. Non-empty = inside an area that has
 *                     categories ticked, only those; areas with none ticked
 *                     stay whole.
 *
 * Nothing ticked is the same as everything ticked, so the boxes start
 * unticked and stay quiet until the first click. Ticking an area OPENS it and reveals its
 * categories, all unticked. The invariant that keeps this readable:
 * `categories` may only contain categories whose area is in `areas`, so
 * unticking an area drops its categories with it. Otherwise a category could
 * keep filtering from inside a closed section.
 */
export type SeenFilter = 'all' | 'unseen' | 'seen';
export type WatchLaterFilter = 'all' | 'only';

export type FilterState = {
  areas: string[];
  categories: string[];
  /** Rating range, inclusive. Equal to the data's bounds when not narrowed. */
  score: [number, number];
  /** YYYY-MM-DD or '' for no limit. */
  dateFrom: string;
  dateTo: string;
  /** Minutes, null for no limit. */
  minMinutes: number | null;
  maxMinutes: number | null;
  seen: SeenFilter;
  /** 'only' shows just what is in the watch-later playlist. */
  watchLater: WatchLaterFilter;
  query: string;
  /**
   * What the result should NOT be about ("god, religion"). Next to a query it
   * pulls matches down the ranking; on its own it hides videos about it.
   */
  exclude: string;
  /** 0..1, how hard `exclude` pulls down. */
  excludeStrength: number;
  /** 0..1, the rating's share in "Best match"; the rest is relevance. */
  blend: number;
};

export const DEFAULT_EXCLUDE_STRENGTH = 0.25;
export const DEFAULT_BLEND = 0.2;

export type Bounds = { score: [number, number] };

export function boundsOf(videos: Video[]): Bounds {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of videos) {
    lo = Math.min(lo, v.score);
    hi = Math.max(hi, v.score);
  }
  return { score: [Math.floor(lo), Math.ceil(hi)] };
}

export function emptyFilters(bounds: Bounds): FilterState {
  return {
    areas: [],
    categories: [],
    score: bounds.score,
    dateFrom: '',
    dateTo: '',
    minMinutes: null,
    maxMinutes: null,
    seen: 'all',
    watchLater: 'all',
    query: '',
    exclude: '',
    excludeStrength: DEFAULT_EXCLUDE_STRENGTH,
    blend: DEFAULT_BLEND,
  };
}

export class Taxonomy {
  private areaOf = new Map<string, string>();

  constructor(readonly areas: Area[]) {
    for (const a of areas) {
      for (const c of a.categories) {
        this.areaOf.set(c.id, a.id);
      }
    }
  }

  areaOfCategory(categoryId: string): string | undefined {
    return this.areaOf.get(categoryId);
  }
}

export function toggleArea(
  s: FilterState,
  areaId: string,
  tax: Taxonomy
): FilterState {
  if (s.areas.length === 0) {
    return { ...s, areas: [areaId], categories: [] };
  }
  if (s.areas.includes(areaId)) {
    return {
      ...s,
      areas: s.areas.filter(a => a !== areaId),
      categories: s.categories.filter(c => tax.areaOfCategory(c) !== areaId),
    };
  }
  return { ...s, areas: [...s.areas, areaId] };
}

export function toggleCategory(s: FilterState, categoryId: string) {
  return {
    ...s,
    categories: s.categories.includes(categoryId)
      ? s.categories.filter(c => c !== categoryId)
      : [...s.categories, categoryId],
  };
}

export function categoryMatcher(
  s: FilterState,
  tax: Taxonomy
): (cats: string[]) => boolean {
  if (s.areas.length === 0 && s.categories.length === 0) {
    return () => true;
  }
  const narrowed = new Set(
    s.categories.map(c => tax.areaOfCategory(c)).filter(Boolean)
  );
  const whole = new Set(s.areas.filter(a => !narrowed.has(a)));
  const picked = new Set(s.categories);
  return cats =>
    cats.some(c => {
      const area = tax.areaOfCategory(c);
      return picked.has(c) || (area !== undefined && whole.has(area));
    });
}

/** How many criteria are narrowing the list; drives the reset button. */
export function activeCount(s: FilterState, bounds: Bounds): number {
  return (
    (s.areas.length ? 1 : 0) +
    (s.score[0] > bounds.score[0] || s.score[1] < bounds.score[1] ? 1 : 0) +
    (s.dateFrom || s.dateTo ? 1 : 0) +
    (s.minMinutes !== null || s.maxMinutes !== null ? 1 : 0) +
    (s.seen !== 'all' ? 1 : 0) +
    (s.watchLater !== 'all' ? 1 : 0) +
    (s.query.trim() ? 1 : 0) +
    (s.exclude.trim() ? 1 : 0)
  );
}

const NO_WATCH_LATER: ReadonlyMap<string, number> = new Map();

export function applyFilters(
  videos: Video[],
  s: FilterState,
  tax: Taxonomy,
  seen: ReadonlySet<string>,
  watchLater: ReadonlyMap<string, number> = NO_WATCH_LATER
): Video[] {
  const catOk = categoryMatcher(s, tax);
  const minSec = s.minMinutes === null ? null : s.minMinutes * 60;
  const maxSec = s.maxMinutes === null ? null : s.maxMinutes * 60;
  return videos.filter(v => {
    if (v.score < s.score[0] || v.score > s.score[1]) {
      return false;
    }
    if (s.dateFrom && (!v.published || v.published < s.dateFrom)) {
      return false;
    }
    if (s.dateTo && (!v.published || v.published > s.dateTo)) {
      return false;
    }
    if (minSec !== null && (v.duration === null || v.duration < minSec)) {
      return false;
    }
    if (maxSec !== null && (v.duration === null || v.duration > maxSec)) {
      return false;
    }
    if (s.seen === 'seen' && !seen.has(v.id)) {
      return false;
    }
    if (s.seen === 'unseen' && seen.has(v.id)) {
      return false;
    }
    if (s.watchLater === 'only' && !watchLater.has(v.id)) {
      return false;
    }
    return catOk(v.cats);
  });
}

export type SortKey =
  | 'relevance'
  | 'best'
  | 'added'
  | 'rating'
  | 'newest'
  | 'oldest'
  | 'views'
  | 'longest'
  | 'shortest';

const NONE = -Infinity;

const SORTS: Record<
  Exclude<SortKey, 'relevance' | 'best' | 'added'>,
  (a: Video, b: Video) => number
> = {
  rating: (a, b) => b.score - a.score,
  newest: (a, b) => (b.published ?? '').localeCompare(a.published ?? ''),
  oldest: (a, b) => (a.published ?? '9').localeCompare(b.published ?? '9'),
  views: (a, b) => (b.views ?? NONE) - (a.views ?? NONE),
  longest: (a, b) => (b.duration ?? NONE) - (a.duration ?? NONE),
  shortest: (a, b) => (a.duration ?? Infinity) - (b.duration ?? Infinity),
};

/** How many top matches "Best match" reorders by rating. */
const POOL = 100;

/**
 * Relevance and rating on one scale, without letting either swamp the other.
 *
 * They cannot be added raw: similarity sits in a narrow band while rating runs
 * 0-25 and a quarter of videos are 0. So both become percentile ranks (0-1)
 * and are blended. Only the top POOL by relevance are reordered; the rest
 * follow in relevance order, so a rating-25 video that barely relates to the
 * query can never outrank one that is exactly on topic.
 */
function bestMatch(
  videos: Video[],
  relevance: Float32Array,
  indexOf: ReadonlyMap<string, number>,
  blend: number
): Video[] {
  const byRelevance = [...videos].sort(
    (a, b) => relevance[indexOf.get(b.id)!] - relevance[indexOf.get(a.id)!]
  );
  const pool = byRelevance.slice(0, POOL);
  const n = pool.length;
  if (n < 2) {
    return byRelevance;
  }

  // Rating percentile within the pool; equal ratings share their mean rank.
  const byScore = [...pool].sort((a, b) => a.score - b.score);
  const scoreRank = new Map<string, number>();
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && byScore[j + 1].score === byScore[i].score) {
      j++;
    }
    const rank = (i + j) / 2 / (n - 1);
    for (let k = i; k <= j; k++) {
      scoreRank.set(byScore[k].id, rank);
    }
    i = j + 1;
  }

  const final = new Map(
    pool.map((v, i) => [
      v.id,
      (1 - blend) * (1 - i / (n - 1)) + blend * scoreRank.get(v.id)!,
    ])
  );
  pool.sort((a, b) => final.get(b.id)! - final.get(a.id)!);
  return [...pool, ...byRelevance.slice(POOL)];
}

/**
 * `relevance` is indexed like the full video list, which is why it is looked
 * up by the video's position in it rather than in the filtered array. Without
 * it (no query, or still computing) both query sorts fall back to rating.
 */
export function sortVideos(
  videos: Video[],
  key: SortKey,
  relevance: Float32Array | null,
  indexOf: ReadonlyMap<string, number>,
  blend: number = DEFAULT_BLEND,
  addedAt: ReadonlyMap<string, number> = NO_WATCH_LATER
): Video[] {
  if (key === 'best' && relevance) {
    return bestMatch(videos, relevance, indexOf, blend);
  }
  const out = [...videos];
  if (key === 'added') {
    // Latest addition first; anything not in the playlist falls to the end,
    // best rated first, so the order stays sensible without a watch-later.
    return out.sort(
      (a, b) =>
        (addedAt.get(b.id) ?? -1) - (addedAt.get(a.id) ?? -1) ||
        b.score - a.score
    );
  }
  if (key === 'relevance' && relevance) {
    return out.sort(
      (a, b) => relevance[indexOf.get(b.id)!] - relevance[indexOf.get(a.id)!]
    );
  }
  return out.sort(
    SORTS[key === 'relevance' || key === 'best' ? 'rating' : key]
  );
}

const SEEN_VALUES: readonly SeenFilter[] = ['all', 'unseen', 'seen'];
const SORT_KEYS: readonly SortKey[] = [
  'relevance',
  'best',
  'added',
  'rating',
  'newest',
  'oldest',
  'views',
  'longest',
  'shortest',
];

/** A search saved by name, like a playlist. Lives in the person's Firestore doc. */
export type SavedSearch = {
  id: string;
  name: string;
  filters: FilterState;
  sort: SortKey;
  createdAt: number;
};

const num = (x: unknown): number | null =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;

const unit = (x: unknown, fallback: number): number =>
  typeof x === 'number' && Number.isFinite(x)
    ? Math.min(1, Math.max(0, x))
    : fallback;

const strings = (x: unknown): string[] =>
  Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : [];

/**
 * Turn whatever was stored back into a valid FilterState.
 *
 * Stored state outlives the code and the data that wrote it: a category can be
 * renamed away, the rating bounds move when the dataset is rebuilt, a person
 * can edit localStorage. So nothing is trusted. Unknown ids are dropped, the
 * rating is clamped into today's bounds, and the area/category invariant is
 * re-established, so a restored selection can never filter from inside a
 * closed section.
 */
export function restoreFilters(
  raw: unknown,
  bounds: Bounds,
  tax: Taxonomy
): FilterState {
  const base = emptyFilters(bounds);
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const r = raw as Record<string, unknown>;

  const areaIds = new Set(tax.areas.map(a => a.id));
  const areas = strings(r.areas).filter(a => areaIds.has(a));
  const categories = strings(r.categories).filter(c => {
    const area = tax.areaOfCategory(c);
    return area !== undefined && areas.includes(area);
  });

  let score = base.score;
  if (
    Array.isArray(r.score) &&
    r.score.length === 2 &&
    r.score.every(n => typeof n === 'number' && Number.isFinite(n))
  ) {
    const [lo, hi] = bounds.score;
    const a = Math.min(hi, Math.max(lo, Math.min(r.score[0], r.score[1])));
    const b = Math.min(hi, Math.max(lo, Math.max(r.score[0], r.score[1])));
    score = [a, b];
  }

  const date = (x: unknown) =>
    typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '';

  return {
    areas,
    categories,
    score,
    dateFrom: date(r.dateFrom),
    dateTo: date(r.dateTo),
    minMinutes: num(r.minMinutes),
    maxMinutes: num(r.maxMinutes),
    seen: SEEN_VALUES.includes(r.seen as SeenFilter)
      ? (r.seen as SeenFilter)
      : 'all',
    watchLater: r.watchLater === 'only' ? 'only' : 'all',
    query: typeof r.query === 'string' ? r.query : '',
    exclude: typeof r.exclude === 'string' ? r.exclude : '',
    excludeStrength: unit(r.excludeStrength, DEFAULT_EXCLUDE_STRENGTH),
    blend: unit(r.blend, DEFAULT_BLEND),
  };
}

export function restoreSort(raw: unknown, query: string): SortKey {
  const key = SORT_KEYS.includes(raw as SortKey) ? (raw as SortKey) : 'rating';
  // Both only mean something while there is a query to be relevant to.
  return (key === 'relevance' || key === 'best') && !query.trim()
    ? 'rating'
    : key;
}

export function restoreSearch(
  id: string,
  raw: unknown,
  bounds: Bounds,
  tax: Taxonomy
): SavedSearch | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) {
    return null;
  }
  const filters = restoreFilters(r.filters, bounds, tax);
  return {
    id,
    name: r.name,
    filters,
    sort: restoreSort(r.sort, filters.query),
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0,
  };
}

/** Key order is fixed by restoreFilters/emptyFilters, so stringify compares. */
export function sameFilters(a: FilterState, b: FilterState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** One line saying what a saved search narrows by, for the Saved tab. */
export function describeFilters(
  s: FilterState,
  bounds: Bounds,
  tax: Taxonomy
): string {
  const parts: string[] = [];
  if (s.query.trim()) {
    parts.push(`“${s.query.trim()}”`);
  }
  if (s.exclude.trim()) {
    parts.push(`not “${s.exclude.trim()}”`);
  }
  if (s.areas.length) {
    const names = s.areas
      .map(id => tax.areas.find(a => a.id === id)?.name)
      .filter((n): n is string => !!n);
    parts.push(
      names.length > 2
        ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
        : names.join(', ')
    );
  }
  if (s.categories.length) {
    parts.push(
      `${s.categories.length} categor${s.categories.length === 1 ? 'y' : 'ies'}`
    );
  }
  if (s.score[0] > bounds.score[0] || s.score[1] < bounds.score[1]) {
    parts.push(`rating ${s.score[0]}–${s.score[1]}`);
  }
  if (s.dateFrom || s.dateTo) {
    parts.push(`${s.dateFrom || '…'} → ${s.dateTo || '…'}`);
  }
  if (s.minMinutes !== null || s.maxMinutes !== null) {
    parts.push(`${s.minMinutes ?? 0}–${s.maxMinutes ?? '∞'} min`);
  }
  if (s.seen !== 'all') {
    parts.push(s.seen === 'unseen' ? 'not seen' : 'seen');
  }
  if (s.watchLater === 'only') {
    parts.push('watch later');
  }
  return parts.join(' · ');
}

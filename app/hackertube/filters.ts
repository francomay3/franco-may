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
 * Nothing ticked is the same as everything ticked, so every box shows as
 * ticked until the first click. Ticking an area OPENS it and reveals its
 * categories, all unticked. The invariant that keeps this readable:
 * `categories` may only contain categories whose area is in `areas`, so
 * unticking an area drops its categories with it. Otherwise a category could
 * keep filtering from inside a closed section.
 */
export type SeenFilter = 'all' | 'unseen' | 'seen';

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
  query: string;
};

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
    query: '',
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
    (s.query.trim() ? 1 : 0)
  );
}

export function applyFilters(
  videos: Video[],
  s: FilterState,
  tax: Taxonomy,
  seen: ReadonlySet<string>
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
    return catOk(v.cats);
  });
}

export type SortKey =
  | 'relevance'
  | 'rating'
  | 'newest'
  | 'oldest'
  | 'views'
  | 'longest'
  | 'shortest';

const NONE = -Infinity;

const SORTS: Record<
  Exclude<SortKey, 'relevance'>,
  (a: Video, b: Video) => number
> = {
  rating: (a, b) => b.score - a.score,
  newest: (a, b) => (b.published ?? '').localeCompare(a.published ?? ''),
  oldest: (a, b) => (a.published ?? '9').localeCompare(b.published ?? '9'),
  views: (a, b) => (b.views ?? NONE) - (a.views ?? NONE),
  longest: (a, b) => (b.duration ?? NONE) - (a.duration ?? NONE),
  shortest: (a, b) => (a.duration ?? Infinity) - (b.duration ?? Infinity),
};

/**
 * `similarity` is indexed like the full video list, which is why it is looked
 * up by the video's position in it rather than in the filtered array.
 */
export function sortVideos(
  videos: Video[],
  key: SortKey,
  similarity: Float32Array | null,
  indexOf: ReadonlyMap<string, number>
): Video[] {
  const out = [...videos];
  if (key === 'relevance' && similarity) {
    return out.sort(
      (a, b) => similarity[indexOf.get(b.id)!] - similarity[indexOf.get(a.id)!]
    );
  }
  return out.sort(SORTS[key === 'relevance' ? 'rating' : key]);
}

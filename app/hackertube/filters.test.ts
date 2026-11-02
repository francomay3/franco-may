import {
  Taxonomy,
  activeCount,
  applyFilters,
  boundsOf,
  describeFilters,
  emptyFilters,
  restoreFilters,
  restoreSort,
  sameFilters,
  sortVideos,
  toggleArea,
  toggleCategory,
} from './filters';
import { channelStats } from './channels';
import { combineRelevance, excludeMask } from './search';
import type { Video } from './types';

const tax = new Taxonomy([
  {
    id: 'math',
    name: 'Math',
    categories: [
      { id: 'algebra', name: 'Algebra' },
      { id: 'logic', name: 'Logic' },
    ],
  },
  { id: 'sw', name: 'Software', categories: [{ id: 'rust', name: 'Rust' }] },
]);

const video = (
  id: string,
  cats: string[],
  over: Partial<Video> = {}
): Video => ({
  id,
  title: id,
  channel: 'c',
  channelId: 'c1',
  summary: '',
  whyHn: '',
  type: 'talk',
  shelfLife: 'evergreen',
  tags: [],
  cats,
  score: 5,
  recommenders: 1,
  published: '2020-06-15',
  duration: 600,
  views: 1,
  likes: 1,
  embeddable: true,
  gone: false,
  ...over,
});

const videos = [
  video('a', ['algebra']),
  video('b', ['logic']),
  video('c', ['rust']),
  video('d', ['algebra', 'rust']),
];
const ids = (vs: Video[]) => vs.map(v => v.id).join('');
const none = new Set<string>();
const empty = emptyFilters(boundsOf(videos));

describe('category selection', () => {
  it('shows everything when nothing is ticked', () => {
    expect(ids(applyFilters(videos, empty, tax, none))).toBe('abcd');
  });

  it('ticking an area keeps the whole area and opens it', () => {
    const s = toggleArea(empty, 'math', tax);
    expect(s).toMatchObject({ areas: ['math'], categories: [] });
    expect(ids(applyFilters(videos, s, tax, none))).toBe('abd');
  });

  it('ticking categories narrows inside that area only', () => {
    let s = toggleArea(empty, 'math', tax);
    s = toggleArea(s, 'sw', tax);
    s = toggleCategory(s, 'logic');
    // math is narrowed to logic, software stays whole.
    expect(ids(applyFilters(videos, s, tax, none))).toBe('bcd');
  });

  it('unticking an area drops its categories', () => {
    let s = toggleArea(empty, 'math', tax);
    s = toggleArea(s, 'sw', tax);
    s = toggleCategory(s, 'logic');
    s = toggleArea(s, 'math', tax);
    expect(s).toMatchObject({ areas: ['sw'], categories: [] });
  });

  it('unticking the last area goes back to everything', () => {
    let s = toggleArea(empty, 'math', tax);
    s = toggleArea(s, 'math', tax);
    expect(ids(applyFilters(videos, s, tax, none))).toBe('abcd');
  });
});

describe('other filters', () => {
  it('filters by rating, date, length and seen', () => {
    const vs = [
      video('a', [], { score: 2, published: '2010-01-01', duration: 60 }),
      video('b', [], { score: 9, published: '2020-01-01', duration: 3600 }),
    ];
    const f = emptyFilters(boundsOf(vs));
    expect(ids(applyFilters(vs, { ...f, score: [5, 9] }, tax, none))).toBe('b');
    expect(
      ids(applyFilters(vs, { ...f, dateTo: '2015-01-01' }, tax, none))
    ).toBe('a');
    expect(ids(applyFilters(vs, { ...f, minMinutes: 10 }, tax, none))).toBe(
      'b'
    );
    expect(ids(applyFilters(vs, { ...f, maxMinutes: 10 }, tax, none))).toBe(
      'a'
    );
    expect(
      ids(applyFilters(vs, { ...f, seen: 'seen' }, tax, new Set(['a'])))
    ).toBe('a');
    expect(
      ids(applyFilters(vs, { ...f, seen: 'unseen' }, tax, new Set(['a'])))
    ).toBe('b');
  });
});

describe('restoring stored state', () => {
  const bounds = boundsOf(videos);

  it('returns an empty selection for junk', () => {
    expect(restoreFilters(null, bounds, tax)).toEqual(empty);
    expect(restoreFilters('x', bounds, tax)).toEqual(empty);
    expect(restoreFilters({ areas: 5, seen: 'bogus' }, bounds, tax)).toEqual(
      empty
    );
  });

  it('drops unknown ids and re-establishes the area/category invariant', () => {
    const s = restoreFilters(
      { areas: ['math', 'gone'], categories: ['algebra', 'rust', 'nope'] },
      bounds,
      tax
    );
    // rust belongs to software, which is not open, so it cannot stay.
    expect(s).toMatchObject({ areas: ['math'], categories: ['algebra'] });
  });

  it('clamps the rating into the current bounds', () => {
    const s = restoreFilters({ score: [-10, 99] }, bounds, tax);
    expect(s.score).toEqual(bounds.score);
  });

  it('round-trips a real selection', () => {
    let s = toggleArea(empty, 'math', tax);
    s = toggleCategory(s, 'logic');
    s = {
      ...s,
      dateFrom: '2020-01-01',
      minMinutes: 5,
      query: 'proofs',
      seen: 'unseen',
    };
    const back = restoreFilters(JSON.parse(JSON.stringify(s)), bounds, tax);
    expect(sameFilters(back, s)).toBe(true);
  });

  it('only keeps relevance sorting while there is a query', () => {
    expect(restoreSort('relevance', '')).toBe('rating');
    expect(restoreSort('relevance', 'x')).toBe('relevance');
    expect(restoreSort('nonsense', 'x')).toBe('rating');
  });

  it('describes a selection in one line', () => {
    const s = {
      ...toggleArea(empty, 'math', tax),
      query: 'proofs',
      seen: 'unseen' as const,
    };
    expect(describeFilters(s, bounds, tax)).toBe('“proofs” · Math · not seen');
  });
});

describe('best match', () => {
  // 400 videos; index i has relevance 400 - i, so v0 is the most relevant.
  const many = Array.from({ length: 400 }, (_, i) =>
    video(`v${i}`, [], { score: i === 350 ? 25 : i % 5 })
  );
  const indexOf = new Map(many.map((v, i) => [v.id, i]));
  const relevance = Float32Array.from(many, (_, i) => 400 - i);
  const order = (blend: number) =>
    sortVideos(many, 'best', relevance, indexOf, blend).map(v => v.id);

  it('is pure relevance when the rating has no weight', () => {
    expect(order(0).slice(0, 3)).toEqual(['v0', 'v1', 'v2']);
  });

  it('lets rating lift a close match above a closer, lower-rated one', () => {
    const ids = order(1);
    // v4 has rating 4 (the pool's best apart from v350, which is out of it).
    expect(ids.indexOf('v4')).toBeLessThan(ids.indexOf('v0'));
  });

  it('never lifts a video from outside the top of the pool', () => {
    // v350 has the highest rating of all but is not among the top of the pool.
    expect(order(1).indexOf('v350')).toBeGreaterThanOrEqual(100);
  });

  it('falls back to rating without relevance scores', () => {
    const ids = sortVideos(many, 'best', null, indexOf).map(v => v.id);
    expect(ids[0]).toBe('v350');
  });
});

describe('exclude', () => {
  it('pulls down videos unusually close to the negative query', () => {
    const pos = Float32Array.from([4, 3, 2, 1, 0]);
    const neg = Float32Array.from([9, 0, 0, 0, 0]);
    const out = combineRelevance(pos, neg, 0.5)!;
    const top = out.indexOf(Math.max(...out));
    // The best positive match is also the one about the excluded topic.
    expect(top).toBe(1);
  });

  it('leaves the ranking alone with no negative query or no strength', () => {
    const pos = Float32Array.from([1, 2, 3]);
    expect(combineRelevance(pos, null, 0.5)).toBe(pos);
    expect(combineRelevance(pos, Float32Array.from([9, 0, 0]), 0)).toBe(pos);
    expect(combineRelevance(null, pos, 0.5)).toBeNull();
  });

  it('counts as active alone or with a query, and restores safely', () => {
    const b = boundsOf(videos);
    expect(activeCount({ ...empty, exclude: 'god' }, b)).toBe(1);
    expect(activeCount({ ...empty, query: 'x', exclude: 'god' }, b)).toBe(2);
    const s = restoreFilters(
      { exclude: 5, excludeStrength: 9, blend: -1 },
      b,
      tax
    );
    expect(s).toMatchObject({ exclude: '', excludeStrength: 1, blend: 0 });
    expect(restoreFilters({}, b, tax)).toEqual(empty);
    expect(restoreSort('best', '')).toBe('rating');
    expect(restoreSort('best', 'x')).toBe('best');
  });
});

describe('exclude without a query', () => {
  it('hides only videos unusually close to the negative query', () => {
    // One outlier in 20 stands well above the rest.
    const neg = Float32Array.from({ length: 20 }, (_, i) =>
      i === 7 ? 1 : 0.5
    );
    const mask = excludeMask(neg, 0.5)!;
    expect(Array.from(mask).reduce((a, b) => a + b, 0)).toBe(1);
    expect(mask[7]).toBe(1);
  });

  it('hides nothing at zero strength or without a negative query', () => {
    expect(excludeMask(Float32Array.from([1, 2, 3]), 0)).toBeNull();
    expect(excludeMask(null, 0.5)).toBeNull();
  });
});

describe('watch later', () => {
  const vs = [video('a', []), video('b', []), video('c', [])];
  const f = emptyFilters(boundsOf(vs));
  const later = new Map([
    ['b', 100],
    ['c', 200],
  ]);

  it('shows only the playlist when asked', () => {
    const only = { ...f, watchLater: 'only' as const };
    expect(ids(applyFilters(vs, only, tax, none, later))).toBe('bc');
    expect(ids(applyFilters(vs, f, tax, none, later))).toBe('abc');
  });

  it('sorts the playlist by when each was added, newest first', () => {
    const indexOf = new Map(vs.map((v, i) => [v.id, i]));
    const out = sortVideos(vs, 'added', null, indexOf, 0.2, later);
    expect(ids(out)).toBe('cba');
  });

  it('restores, counts and describes the filter', () => {
    const b = boundsOf(vs);
    const s = restoreFilters({ watchLater: 'only' }, b, tax);
    expect(s.watchLater).toBe('only');
    expect(restoreFilters({ watchLater: 'x' }, b, tax).watchLater).toBe('all');
    expect(activeCount(s, b)).toBe(1);
    expect(describeFilters(s, b, tax)).toBe('watch later');
    expect(restoreSort('added', '')).toBe('added');
  });
});

describe('channel stats', () => {
  it('summarises what the dataset knows about a channel', () => {
    const vs = [
      video('a', ['x', 'y'], {
        score: 10,
        recommenders: 4,
        views: 100,
        published: '2012-05-01',
      }),
      video('b', ['x'], {
        score: 2,
        recommenders: 1,
        views: 50,
        published: '2020-01-01',
      }),
      video('c', ['z'], {
        score: 6,
        recommenders: 2,
        views: null,
        published: null,
        channel: 'Other name',
      }),
    ];
    const s = channelStats(vs);
    expect(s).toMatchObject({
      name: 'c',
      videos: 3,
      recommenders: 7,
      bestRating: 10,
      views: 150,
      firstYear: 2012,
      lastYear: 2020,
    });
    expect(s.avgRating).toBeCloseTo(6);
    expect(s.topCategories[0]).toEqual({ id: 'x', count: 2 });
  });
});

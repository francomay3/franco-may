import {
  Taxonomy,
  applyFilters,
  boundsOf,
  emptyFilters,
  toggleArea,
  toggleCategory,
} from './filters';
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

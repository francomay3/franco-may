import {
  EXPLORE_EVERY,
  SEEN_SHARE,
  buildFeed,
  clusterTastes,
  collectSignals,
} from './feed';
import { type SimilarityData, unitRow } from './similar';
import { DIM, type Video } from './types';

type Spec = {
  id: string;
  vec: number[];
  score?: number;
  channelId?: string;
  shelfLife?: string;
  gone?: boolean;
};

function build(specs: Spec[]): SimilarityData {
  const videos: Video[] = specs.map(s => ({
    id: s.id,
    title: `title ${s.id}`,
    channel: `channel of ${s.id}`,
    channelId: s.channelId ?? `c-${s.id}`,
    summary: '',
    whyHn: '',
    type: 'talk',
    shelfLife: s.shelfLife ?? 'evergreen',
    tags: [],
    cats: [],
    score: s.score ?? 5,
    recommenders: 1,
    published: '2020-01-01',
    duration: 600,
    views: 1,
    likes: 1,
    embeddable: true,
    gone: s.gone ?? false,
  }));
  const embeddings = new Int8Array(specs.length * DIM);
  specs.forEach((s, i) =>
    s.vec.forEach((x, d) => (embeddings[i * DIM + d] = x))
  );
  return {
    videos,
    indexOf: new Map(videos.map((v, i) => [v.id, i])),
    embeddings,
    related: new Map(),
  };
}

/** `n` videos around one direction, each a little different. */
function around(prefix: string, dir: number, n: number, score = 5): Spec[] {
  return Array.from({ length: n }, (_, i) => {
    const vec = [0, 0, 0];
    vec[dir] = 100;
    vec[(dir + 1) % 3] = (i % 9) - 4;
    return { id: `${prefix}${i}`, vec, score };
  });
}

const NONE = new Set<string>();
const ids = (feed: { items: { video: Video }[] }) =>
  feed.items.map(x => x.video.id);

describe('for-you feed', () => {
  it('without likes shows well-rated videos and says it is not personal', () => {
    const data = build([
      ...around('low', 0, 30, 1),
      ...around('top', 1, 30, 20),
    ]);
    const feed = buildFeed(data, {
      liked: [],
      disliked: [],
      seen: NONE,
      saved: [],
      seed: 1,
    });
    expect(feed.personalised).toBe(false);
    expect(feed.items.every(x => x.because === null)).toBe(true);
    const firstTen = ids(feed).slice(0, 10);
    expect(firstTen.filter(id => id.startsWith('top')).length).toBeGreaterThan(
      6
    );
  });

  it('leaves out liked, not-interested, news and removed videos', () => {
    const data = build([
      ...around('a', 0, 20),
      { id: 'news', vec: [100, 0, 0], shelfLife: 'news' },
      { id: 'gone', vec: [100, 0, 0], gone: true },
    ]);
    const feed = buildFeed(data, {
      liked: ['a0', 'a1'],
      disliked: ['a2'],
      seen: NONE,
      saved: [],
      seed: 1,
    });
    const got = ids(feed);
    for (const id of ['a0', 'a1', 'a2', 'news', 'gone']) {
      expect(got).not.toContain(id);
    }
    expect(got).toContain('a3');
  });

  it('leaves out a re-upload of something you liked', () => {
    const data = build([...around('a', 0, 10), ...around('b', 1, 10)]);
    (data.videos as Video[])[5] = {
      ...data.videos[5],
      title: data.videos[0].title,
    };
    const feed = buildFeed(data, {
      liked: ['a0'],
      disliked: [],
      seen: NONE,
      saved: [],
      seed: 1,
    });
    expect(ids(feed)).not.toContain('a5');
  });

  it('is the same for the same seed and different for another', () => {
    const data = build([...around('a', 0, 60), ...around('b', 1, 60)]);
    const input = { liked: ['a0'], disliked: [], seen: NONE, saved: [] };
    const one = ids(buildFeed(data, { ...input, seed: 7 }));
    expect(ids(buildFeed(data, { ...input, seed: 7 }))).toEqual(one);
    expect(ids(buildFeed(data, { ...input, seed: 8 }))).not.toEqual(one);
  });

  it('puts what is close to your likes first', () => {
    const data = build([...around('a', 0, 40), ...around('b', 1, 40)]);
    const feed = buildFeed(data, {
      liked: ['a0', 'a1', 'a2'],
      disliked: [],
      seen: NONE,
      saved: [],
      seed: 3,
    });
    // Every tenth place is exploration, so leave those out.
    const first = ids(feed)
      .slice(0, 20)
      .filter((_, i) => (i + 1) % EXPLORE_EVERY !== 0);
    expect(first.every(id => id.startsWith('a'))).toBe(true);
  });

  it('keeps every taste alive instead of averaging them', () => {
    const data = build([...around('a', 0, 40), ...around('b', 1, 40)]);
    const feed = buildFeed(data, {
      liked: ['a0', 'a1', 'a2', 'b0', 'b1', 'b2'],
      disliked: [],
      seen: NONE,
      saved: [],
      seed: 3,
    });
    const first = ids(feed).slice(0, 10);
    expect(first.some(id => id.startsWith('a'))).toBe(true);
    expect(first.some(id => id.startsWith('b'))).toBe(true);
  });

  it('lets a lower-rated video in now and then, but not all of them', () => {
    const specs = [
      ...around('hi', 0, 30, 20),
      ...around('lo', 0, 30, 1),
      ...around('seed', 0, 1, 5),
    ];
    const data = build(specs);
    const share = (seed: number) => {
      const feed = buildFeed(data, {
        liked: ['seed0'],
        disliked: [],
        seen: NONE,
        saved: [],
        seed,
      });
      const first = ids(feed).slice(0, 20);
      return first.filter(id => id.startsWith('lo')).length;
    };
    const counts = [1, 2, 3, 4, 5, 6, 7, 8].map(share);
    expect(Math.max(...counts)).toBeGreaterThan(0);
    expect(Math.min(...counts)).toBeLessThan(10);
  });

  it('never lets seen videos pass their share, at any point of the feed', () => {
    const specs = [...around('s', 0, 60), ...around('u', 0, 60)];
    const data = build(specs);
    const seen = new Set(
      specs.filter(s => s.id.startsWith('s')).map(s => s.id)
    );
    const feed = buildFeed(data, {
      liked: ['u0'],
      disliked: [],
      seen,
      saved: [],
      seed: 5,
    });
    let count = 0;
    ids(feed).forEach((id, i) => {
      if (seen.has(id)) {
        count++;
      }
      expect(count).toBeLessThanOrEqual(SEEN_SHARE * (i + 1));
    });
    // Seen videos are pushed down, not banned: some still show up.
    expect(count).toBeGreaterThan(0);
  });

  it('pushes down videos close to one you are not interested in', () => {
    const specs = [
      ...around('a', 0, 12),
      ...around('b', 1, 60),
      { id: 'seed', vec: [70, 70, 0] },
    ];
    const data = build(specs);
    const run = (disliked: string[]) =>
      ids(
        buildFeed(data, {
          liked: ['seed'],
          disliked,
          seen: NONE,
          saved: [],
          seed: 2,
        })
      ).slice(0, 20);
    const base = run([]);
    const after = run(['a0', 'a1']);
    const aShare = (list: string[]) =>
      list.filter(id => id.startsWith('a')).length;
    expect(aShare(after)).toBeLessThan(aShare(base));
  });

  it('says which liked video each one is closest to', () => {
    const data = build([...around('a', 0, 20), ...around('b', 1, 20)]);
    const feed = buildFeed(data, {
      liked: ['a0', 'b0', 'b1', 'b2', 'a1', 'a2'],
      disliked: [],
      seen: NONE,
      saved: [],
      seed: 1,
    });
    for (const { video, because } of feed.items) {
      expect(because).not.toBeNull();
      expect(because!.id[0]).toBe(video.id[0]);
    }
  });
});

describe('what the feed learns from', () => {
  const data = build([
    ...around('a', 0, 40),
    ...around('b', 1, 40),
    ...around('c', 2, 40),
  ]);
  const base = { disliked: [], liked: [], seen: NONE, saved: [], seed: 1 };

  it('weighs a video once, at its strongest signal', () => {
    const got = collectSignals(
      {
        ...base,
        liked: ['a0'],
        seen: new Set(['a0', 'a1']),
        saved: ['a1', 'a2'],
      },
      data.indexOf
    );
    const byId = new Map(got.map(s => [data.videos[s.index].id, s.weight]));
    expect(byId.get('a0')).toBe(1);
    expect(byId.get('a1')).toBeCloseTo(1 / 3);
    expect(byId.get('a2')).toBeCloseTo(1 / 5);
    expect(got).toHaveLength(3);
  });

  it('drops a dismissed video even if it was seen or liked', () => {
    const got = collectSignals(
      {
        ...base,
        liked: ['a0'],
        seen: new Set(['a1']),
        disliked: ['a0', 'a1'],
      },
      data.indexOf
    );
    expect(got).toHaveLength(0);
  });

  it('holds watched and saved together to the weight of the likes', () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => `b${i}`));
    const got = collectSignals({ ...base, liked: ['a0'], seen }, data.indexOf);
    const implicit = got.filter(s => !s.liked);
    expect(implicit.reduce((n, s) => n + s.weight, 0)).toBeCloseTo(1);
    // With no likes there is nothing to hold them to.
    const alone = collectSignals({ ...base, seen }, data.indexOf);
    expect(alone.reduce((n, s) => n + s.weight, 0)).toBeCloseTo(10);
  });

  it('personalises from watched and saved videos alone', () => {
    const feed = buildFeed(data, {
      ...base,
      seen: new Set(['a0', 'a1']),
      saved: ['a2'],
    });
    expect(feed.personalised).toBe(true);
    expect(ids(feed).slice(0, EXPLORE_EVERY - 1)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^a/)])
    );
    expect(
      ids(feed)
        .slice(0, EXPLORE_EVERY - 1)
        .every(id => id.startsWith('a'))
    ).toBe(true);
  });

  it('says "because you liked" only for likes, not watched or saved', () => {
    const feed = buildFeed(data, {
      ...base,
      liked: ['b0'],
      seen: new Set(['a0', 'a1', 'a2', 'a3', 'a4']),
    });
    const fromA = feed.items.filter(x => x.video.id.startsWith('a'));
    const fromB = feed.items.filter(x => x.video.id.startsWith('b'));
    expect(fromA.length).toBeGreaterThan(0);
    expect(fromA.every(x => x.because === null)).toBe(true);
    expect(fromB.length).toBeGreaterThan(0);
    expect(fromB.every(x => x.because?.id === 'b0')).toBe(true);
  });

  it('reserves every tenth place for corners you have not touched', () => {
    const feed = buildFeed(data, {
      ...base,
      liked: ['a0', 'a1', 'a2', 'a3'],
    });
    const got = ids(feed);
    for (let i = 0; i < EXPLORE_EVERY - 1; i++) {
      expect(got[i].startsWith('a')).toBe(true);
    }
    const explorers = [EXPLORE_EVERY - 1, 2 * EXPLORE_EVERY - 1].map(
      i => got[i]
    );
    expect(explorers.every(id => !id.startsWith('a'))).toBe(true);
    // Spread out: two explorers are not from the same far corner.
    expect(explorers[0][0]).not.toBe(explorers[1][0]);
  });
});

describe('clusterTastes', () => {
  const row = (x: number, y: number) => {
    const v = new Float32Array(DIM);
    v[0] = x;
    v[1] = y;
    return unitRow(new Int8Array([...v].map(n => n * 100)), 0);
  };

  it('keeps few likes as one taste and groups many by direction', () => {
    expect(clusterTastes([row(1, 0), row(0, 1)], [1, 1])).toHaveLength(1);
    const rows = [
      row(1, 0),
      row(1, 0.1),
      row(1, -0.1),
      row(0, 1),
      row(0.1, 1),
      row(-0.1, 1),
    ];
    const groups = clusterTastes(
      rows,
      rows.map(() => 1)
    );
    expect(groups.length).toBeGreaterThanOrEqual(2);
    // Whatever the count, a taste never mixes the two directions.
    for (const g of groups) {
      expect(new Set(g.map(i => (i < 3 ? 'x' : 'y'))).size).toBe(1);
    }
  });
});

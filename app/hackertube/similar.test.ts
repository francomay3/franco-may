import {
  coRecommended,
  similarChannels,
  similarToChannel,
  similarToVideo,
  type SimilarityData,
} from './similar';
import { DIM, type Video } from './types';

type Spec = {
  id: string;
  channelId: string;
  /** First coordinates of the vector; the rest are zero. */
  vec: number[];
  title?: string;
  score?: number;
  shelfLife?: string;
};

/** A tiny dataset whose geometry is easy to reason about. */
function build(specs: Spec[], related: SimilarityData['related'] = new Map()) {
  const videos: Video[] = specs.map(s => ({
    id: s.id,
    title: s.title ?? `title ${s.id}`,
    channel: `channel ${s.channelId}`,
    channelId: s.channelId,
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
    gone: false,
  }));
  const embeddings = new Int8Array(specs.length * DIM);
  specs.forEach((s, i) =>
    s.vec.forEach((x, d) => (embeddings[i * DIM + d] = x))
  );
  return {
    videos,
    indexOf: new Map(videos.map((v, i) => [v.id, i])),
    embeddings,
    related,
  } satisfies SimilarityData;
}

const ids = (vs: { id: string }[]) => vs.map(v => v.id);

describe('similar videos', () => {
  it('ranks by closeness, from other channels only', () => {
    const data = build([
      { id: 't', channelId: 'A', vec: [100, 0] },
      { id: 'near', channelId: 'B', vec: [90, 10] },
      { id: 'mid', channelId: 'C', vec: [60, 60] },
      { id: 'far', channelId: 'D', vec: [0, 100] },
      { id: 'mine', channelId: 'A', vec: [99, 1] },
    ]);
    // 'mine' is closest of all but belongs to the same channel.
    expect(ids(similarToVideo(data, 't'))).toEqual(['near', 'mid', 'far']);
  });

  it('skips news and collapses a re-upload of the same title', () => {
    const data = build([
      {
        id: 't',
        channelId: 'A',
        vec: [100, 0],
        title: 'Linear Algebra, Ch. 1',
      },
      {
        id: 'reupload',
        channelId: 'B',
        vec: [99, 1],
        title: 'linear algebra ch 1',
      },
      { id: 'news', channelId: 'C', vec: [98, 2], shelfLife: 'news' },
      { id: 'ok', channelId: 'D', vec: [80, 20] },
    ]);
    expect(ids(similarToVideo(data, 't'))).toEqual(['ok']);
  });

  it('takes at most two videos from one channel', () => {
    const data = build([
      { id: 't', channelId: 'A', vec: [100, 0] },
      { id: 'b1', channelId: 'B', vec: [95, 5] },
      { id: 'b2', channelId: 'B', vec: [94, 6] },
      { id: 'b3', channelId: 'B', vec: [93, 7] },
      { id: 'c1', channelId: 'C', vec: [50, 50] },
    ]);
    expect(ids(similarToVideo(data, 't'))).toEqual(['b1', 'b2', 'c1']);
  });

  it('lets a better rating overtake a slightly closer video, but never a far one', () => {
    // 20 candidates drifting away from the target, one channel each. All are
    // rated 5 except the closest (0), one a few places behind it (25) and a
    // far one (25).
    const specs = [
      { id: 't', channelId: 'T', vec: [100, 0] },
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `v${i}`,
        channelId: `C${i}`,
        vec: [100, i * 5],
        score: i === 0 ? 0 : i === 2 || i === 19 ? 25 : 5,
      })),
    ];
    const out = ids(similarToVideo(build(specs), 't', 20));
    // v2 is only two places behind v0, so its rating lifts it past.
    expect(out.indexOf('v2')).toBeLessThan(out.indexOf('v0'));
    // v19 is the least similar of all; a top rating must not rescue it.
    expect(out.indexOf('v19')).toBeGreaterThan(out.indexOf('v0'));
    expect(out.indexOf('v19')).toBeGreaterThan(10);
  });

  it('returns nothing for an unknown video', () => {
    expect(
      similarToVideo(build([{ id: 'a', channelId: 'A', vec: [1] }]), 'x')
    ).toEqual([]);
  });
});

describe('similar to a channel', () => {
  it('finds videos near any theme of a broad channel, never its own', () => {
    const data = build([
      // Channel A covers two directions.
      { id: 'a1', channelId: 'A', vec: [100, 0, 0] },
      { id: 'a2', channelId: 'A', vec: [0, 100, 0] },
      { id: 'nearA1', channelId: 'B', vec: [95, 5, 0] },
      { id: 'nearA2', channelId: 'C', vec: [5, 95, 0] },
      { id: 'unrelated', channelId: 'D', vec: [0, 0, 100] },
    ]);
    const out = ids(similarToChannel(data, 'A'));
    expect(out.slice(0, 2).sort()).toEqual(['nearA1', 'nearA2']);
    expect(out).not.toContain('a1');
    expect(out).not.toContain('a2');
    expect(out[out.length - 1]).toBe('unrelated');
  });

  it('returns nothing for a channel with no videos', () => {
    expect(
      similarToChannel(build([{ id: 'a', channelId: 'A', vec: [1] }]), 'ZZ')
    ).toEqual([]);
  });
});

describe('similar channels', () => {
  it('orders channels by how close their videos are on average', () => {
    const data = build([
      { id: 'a1', channelId: 'A', vec: [100, 0] },
      { id: 'b1', channelId: 'B', vec: [90, 10] },
      { id: 'b2', channelId: 'B', vec: [80, 20] },
      { id: 'c1', channelId: 'C', vec: [0, 100] },
    ]);
    const out = similarChannels(data, 'A');
    expect(out.map(c => c.id)).toEqual(['B', 'C']);
    expect(out[0]).toMatchObject({ name: 'channel B', videos: 2 });
    expect(similarChannels(data, 'nope')).toEqual([]);
  });
});

describe('co-recommended', () => {
  it('maps ids to videos in order and drops ones not in the dataset', () => {
    const data = build(
      [
        { id: 'a', channelId: 'A', vec: [1] },
        { id: 'b', channelId: 'B', vec: [1] },
        { id: 'c', channelId: 'C', vec: [1] },
      ],
      new Map([
        [
          'a',
          [
            ['c', 5],
            ['gone', 4],
            ['b', 2],
          ],
        ],
      ])
    );
    const out = coRecommended(data, 'a');
    expect(out.map(r => [r.video.id, r.shared])).toEqual([
      ['c', 5],
      ['b', 2],
    ]);
    expect(coRecommended(data, 'b')).toEqual([]);
  });
});

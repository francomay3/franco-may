import { TWO_WEEKS_MS, orderWatchLater, seenLongAgo } from './watchLaterList';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe('orderWatchLater', () => {
  it('keeps newest bookmarks first when nothing was seen long ago', () => {
    const picks = new Map([
      ['old-save', NOW - 30 * WEEK],
      ['new-save', NOW - WEEK],
      ['recently-seen', NOW - 2 * WEEK],
    ]);
    const seenAt = new Map([['recently-seen', NOW - WEEK]]);
    expect(orderWatchLater(picks, seenAt, NOW)).toEqual([
      'new-save',
      'recently-seen',
      'old-save',
    ]);
  });

  it('sinks videos seen more than two weeks ago, keeping bookmark order in each group', () => {
    const picks = new Map([
      ['fresh', 300],
      ['old-seen-newer-save', 200],
      ['unseen-older-save', 100],
      ['old-seen-older-save', 50],
    ]);
    const seenAt = new Map([
      ['old-seen-newer-save', NOW - TWO_WEEKS_MS - 1],
      ['old-seen-older-save', NOW - 5 * WEEK],
      ['fresh', NOW - WEEK],
    ]);
    expect(orderWatchLater(picks, seenAt, NOW)).toEqual([
      'fresh',
      'unseen-older-save',
      'old-seen-newer-save',
      'old-seen-older-save',
    ]);
  });

  it('leaves a video seen exactly two weeks ago in place', () => {
    const picks = new Map([
      ['exact', 1],
      ['newer', 2],
    ]);
    const seenAt = new Map([['exact', NOW - TWO_WEEKS_MS]]);
    expect(seenLongAgo(NOW - TWO_WEEKS_MS, NOW)).toBe(false);
    expect(orderWatchLater(picks, seenAt, NOW)).toEqual(['newer', 'exact']);
  });

  it('does not sink a seen mark with no usable time', () => {
    const picks = new Map([
      ['missing', 1],
      ['zero', 2],
      ['newer', 3],
    ]);
    const seenAt = new Map<string, number>([['zero', 0]]);
    expect(orderWatchLater(picks, seenAt, NOW)).toEqual([
      'newer',
      'zero',
      'missing',
    ]);
  });
});

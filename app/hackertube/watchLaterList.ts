/** Seen longer ago than this sinks to the bottom of Watch later. */
export const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * A seen mark older than two weeks. A missing time, or a 0 left when the
 * stored value was not a time, stays with the rest of the list.
 */
export function seenLongAgo(at: number | undefined, now: number): boolean {
  return at !== undefined && at > 0 && now - at > TWO_WEEKS_MS;
}

/**
 * Watch later, newest bookmark first. Videos seen more than two weeks ago
 * go last, and keep that same order among themselves.
 */
export function orderWatchLater(
  picks: ReadonlyMap<string, number>,
  seenAt: ReadonlyMap<string, number>,
  now: number
): string[] {
  return [...picks]
    .sort((a, b) => {
      const sunk =
        (seenLongAgo(seenAt.get(a[0]), now) ? 1 : 0) -
        (seenLongAgo(seenAt.get(b[0]), now) ? 1 : 0);
      return sunk !== 0 ? sunk : b[1] - a[1];
    })
    .map(([id]) => id);
}

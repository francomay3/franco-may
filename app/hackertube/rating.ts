/**
 * Where a rating stands among all videos, as "top N%": the share of videos at
 * least as well rated, counting a tie as the best place it could take. The
 * best video is top 1%, never top 0%.
 */
export function topPercent(scores: readonly number[], score: number): number {
  if (scores.length === 0) {
    return 100;
  }
  const better = scores.filter(s => s > score).length;
  return Math.min(
    100,
    Math.max(1, Math.ceil(((better + 1) / scores.length) * 100))
  );
}

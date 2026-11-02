import type { Video } from './types';

/**
 * What the dataset itself says about a channel: only the videos Hacker News
 * has pointed at, so "videos" means videos in HackerTube, not the channel's
 * whole catalogue. Nothing here needs the YouTube API.
 */
export type ChannelStats = {
  name: string;
  videos: number;
  /** Sum of distinct HN recommenders over its videos. */
  recommenders: number;
  avgRating: number;
  bestRating: number;
  views: number;
  firstYear: number | null;
  lastYear: number | null;
  topCategories: { id: string; count: number }[];
};

export const channelHref = (channelId: string) =>
  `/hackertube/channel/${channelId}`;
export const videoHref = (videoId: string) => `/hackertube/video/${videoId}`;
export const youtubeChannelUrl = (channelId: string) =>
  `https://www.youtube.com/channel/${channelId}`;

export function channelStats(videos: Video[]): ChannelStats {
  const names = new Map<string, number>();
  const cats = new Map<string, number>();
  let recommenders = 0;
  let ratingSum = 0;
  let bestRating = 0;
  let views = 0;
  let first: number | null = null;
  let last: number | null = null;

  for (const v of videos) {
    names.set(v.channel, (names.get(v.channel) ?? 0) + 1);
    recommenders += v.recommenders;
    ratingSum += v.score;
    bestRating = Math.max(bestRating, v.score);
    views += v.views ?? 0;
    for (const c of v.cats) {
      cats.set(c, (cats.get(c) ?? 0) + 1);
    }
    if (v.published) {
      const year = Number(v.published.slice(0, 4));
      first = first === null ? year : Math.min(first, year);
      last = last === null ? year : Math.max(last, year);
    }
  }

  const name =
    [...names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';

  return {
    name,
    videos: videos.length,
    recommenders,
    avgRating: videos.length ? ratingSum / videos.length : 0,
    bestRating,
    views,
    firstYear: first,
    lastYear: last,
    topCategories: [...cats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ id, count })),
  };
}

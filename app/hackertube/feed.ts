import {
  type SimilarityData,
  channelKey,
  cosines,
  normalise,
  titleKey,
  unitRow,
} from './similar';
import { DIM, type Video } from './types';

/**
 * The "For you" feed: videos close to what you liked, nudged by rating, with a
 * little luck mixed in.
 *
 * How a video is scored, for each of your tastes:
 *   0.6 closeness to that taste + 0.2 rating + 0.2 random
 * Closeness and rating are percentile ranks within the taste's best candidates
 * (raw cosines sit in a narrow band and ratings run 0-25, so they cannot be
 * added as they are; see `bestMatch`). The random part is what now and then
 * lifts a lower-rated or slightly further-off video above a safer one.
 *
 * Your likes are grouped into up to four tastes, so liking both algebra and
 * woodworking gives you both, not an average of the two that is neither. The
 * feed takes turns between the tastes, in proportion to how many likes each
 * one has. Every like counts the same however old it is.
 *
 * Seen videos are scored down and, whatever their score, never make up more
 * than SEEN_SHARE of the feed at any point of it. Videos you marked "not
 * interested" are gone, and videos close to them are pushed down.
 */
export const FEED_LENGTH = 300;
/** Candidates considered per taste. */
const POOL = 200;
const W_SIM = 0.6;
const W_RATING = 0.2;
const W_NOISE = 0.2;
/** With nothing liked yet there is no closeness: rating leads, luck shuffles. */
const COLD_W_RATING = 0.7;
const COLD_W_NOISE = 0.3;
/** At most this share of the feed (and of any start of it) is already seen. */
export const SEEN_SHARE = 0.2;
const SEEN_PENALTY = 0.35;
const PER_CHANNEL = 3;
const MAX_TASTES = 4;
const DISLIKE_PENALTY = 0.5;

export type FeedInput = {
  liked: readonly string[];
  disliked: readonly string[];
  seen: ReadonlySet<string>;
  /** Fixes the luck: the same seed and inputs give the same feed. */
  seed: number;
};

export type FeedItem = {
  video: Video;
  /** The liked video this is closest to, for "because you liked". */
  because: Video | null;
};

export type Feed = { items: FeedItem[]; personalised: boolean };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let d = 0; d < DIM; d++) {
    sum += a[d] * b[d];
  }
  return sum;
}

/** 0 for the lowest value to 1 for the highest; ties share their mean rank. */
function percentiles(values: number[]): number[] {
  const n = values.length;
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const out = new Array<number>(n).fill(0);
  if (n < 2) {
    return out;
  }
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && values[order[j + 1]] === values[order[i]]) {
      j++;
    }
    for (let k = i; k <= j; k++) {
      out[order[k]] = (i + j) / 2 / (n - 1);
    }
    i = j + 1;
  }
  return out;
}

/**
 * Group unit vectors into up to MAX_TASTES by k-means, one taste per two
 * likes at most. Starts from the vector farthest from those already chosen,
 * so it is the same every time for the same likes.
 */
export function clusterTastes(rows: Float32Array[]): number[][] {
  const k = Math.max(1, Math.min(MAX_TASTES, Math.ceil(rows.length / 2)));
  const centers: Float32Array[] = [rows[0]];
  while (centers.length < k) {
    let far = 0;
    let farDot = Infinity;
    rows.forEach((r, i) => {
      const nearest = Math.max(...centers.map(c => dot(c, r)));
      if (nearest < farDot) {
        farDot = nearest;
        far = i;
      }
    });
    centers.push(rows[far]);
  }

  let assign = new Array<number>(rows.length).fill(0);
  for (let round = 0; round < 10; round++) {
    assign = rows.map(r => {
      let best = 0;
      let bestDot = -Infinity;
      centers.forEach((c, ci) => {
        const d = dot(c, r);
        if (d > bestDot) {
          bestDot = d;
          best = ci;
        }
      });
      return best;
    });
    centers.forEach((_, ci) => {
      const sum = new Float32Array(DIM);
      rows.forEach((r, i) => {
        if (assign[i] === ci) {
          for (let d = 0; d < DIM; d++) {
            sum[d] += r[d];
          }
        }
      });
      if (sum.some(x => x !== 0)) {
        centers[ci] = normalise(sum);
      }
    });
  }

  const groups: number[][] = centers.map(() => []);
  assign.forEach((ci, i) => groups[ci].push(i));
  return groups.filter(g => g.length > 0);
}

type Candidate = { i: number; score: number };

type Taste = {
  weight: number;
  /** Best first. */
  candidates: Candidate[];
  next: number;
  taken: number;
};

export function buildFeed(data: SimilarityData, input: FeedInput): Feed {
  const { videos, indexOf, embeddings } = data;
  const rng = mulberry32(input.seed);

  const likedIdx = input.liked
    .map(id => indexOf.get(id))
    .filter((i): i is number => i !== undefined);
  const dislikedIdx = input.disliked
    .map(id => indexOf.get(id))
    .filter((i): i is number => i !== undefined);
  const out = new Set([...likedIdx, ...dislikedIdx]);

  // How close each video is to something you dismissed, in standard
  // deviations; only "unusually close" (above one) costs anything.
  let dislikePenalty: Float32Array | null = null;
  if (dislikedIdx.length > 0) {
    const nearest = new Float32Array(videos.length).fill(-1);
    for (const di of dislikedIdx) {
      const c = cosines(embeddings, unitRow(embeddings, di));
      for (let i = 0; i < nearest.length; i++) {
        nearest[i] = Math.max(nearest[i], c[i]);
      }
    }
    const mean = nearest.reduce((a, b) => a + b, 0) / nearest.length;
    const sd =
      Math.sqrt(
        nearest.reduce((a, b) => a + (b - mean) ** 2, 0) / nearest.length
      ) || 1;
    dislikePenalty = nearest.map(x =>
      Math.min(1, Math.max(0, (x - mean) / sd - 1) / 2)
    );
  }

  const eligible: number[] = [];
  videos.forEach((v, i) => {
    if (!out.has(i) && !v.gone && v.shelfLife !== 'news') {
      eligible.push(i);
    }
  });

  const likedUnits = likedIdx.map(i => unitRow(embeddings, i));
  const personalised = likedIdx.length > 0;

  const scoreCandidates = (
    pool: number[],
    closeness: Float32Array | null
  ): Candidate[] => {
    const simPct = closeness ? percentiles(pool.map(i => closeness[i])) : null;
    const ratingPct = percentiles(pool.map(i => videos[i].score));
    return pool
      .map((i, p) => {
        const seenCost = input.seen.has(videos[i].id) ? SEEN_PENALTY : 0;
        const dislikeCost = (dislikePenalty?.[i] ?? 0) * DISLIKE_PENALTY;
        const base = simPct
          ? W_SIM * simPct[p] + W_RATING * ratingPct[p] + W_NOISE * rng()
          : COLD_W_RATING * ratingPct[p] + COLD_W_NOISE * rng();
        return { i, score: base - seenCost - dislikeCost };
      })
      .sort((a, b) => b.score - a.score);
  };

  const tastes: Taste[] = [];
  if (personalised) {
    for (const group of clusterTastes(likedUnits)) {
      const sum = new Float32Array(DIM);
      for (const m of group) {
        for (let d = 0; d < DIM; d++) {
          sum[d] += likedUnits[m][d];
        }
      }
      const closeness = cosines(embeddings, normalise(sum));
      const pool = [...eligible]
        .sort((a, b) => closeness[b] - closeness[a])
        .slice(0, POOL);
      tastes.push({
        weight: group.length,
        candidates: scoreCandidates(pool, closeness),
        next: 0,
        taken: 0,
      });
    }
  } else {
    const pool = [...eligible]
      .sort((a, b) => videos[b].score - videos[a].score)
      .slice(0, POOL * 2);
    tastes.push({
      weight: 1,
      candidates: scoreCandidates(pool, null),
      next: 0,
      taken: 0,
    });
  }

  // ---- take turns between the tastes ---------------------------------------
  const picked: Video[] = [];
  const used = new Set<number>();
  // A re-upload of something you liked or dismissed is the same video to you.
  const titles = new Set(
    [...likedIdx, ...dislikedIdx].map(i => titleKey(videos[i].title))
  );
  const perChannel = new Map<string, number>();
  let seenCount = 0;

  const valid = (i: number) => {
    const v = videos[i];
    return (
      !used.has(i) &&
      !titles.has(titleKey(v.title)) &&
      (perChannel.get(channelKey(v)) ?? 0) < PER_CHANNEL
    );
  };

  const take = (t: Taste): Candidate | null => {
    // Whatever can never be used again is dropped from the front for good.
    while (t.next < t.candidates.length && !valid(t.candidates[t.next].i)) {
      t.next++;
    }
    const seenAllowed = seenCount + 1 <= SEEN_SHARE * (picked.length + 1);
    for (let p = t.next; p < t.candidates.length; p++) {
      const c = t.candidates[p];
      if (!valid(c.i)) {
        continue;
      }
      if (input.seen.has(videos[c.i].id) && !seenAllowed) {
        continue;
      }
      return c;
    }
    return null;
  };

  while (picked.length < FEED_LENGTH) {
    const order = [...tastes].sort(
      (a, b) => a.taken / a.weight - b.taken / b.weight
    );
    let chosen: { taste: Taste; c: Candidate } | null = null;
    for (const t of order) {
      const c = take(t);
      if (c) {
        chosen = { taste: t, c };
        break;
      }
    }
    if (!chosen) {
      break;
    }
    const v = videos[chosen.c.i];
    chosen.taste.taken++;
    used.add(chosen.c.i);
    titles.add(titleKey(v.title));
    perChannel.set(channelKey(v), (perChannel.get(channelKey(v)) ?? 0) + 1);
    if (input.seen.has(v.id)) {
      seenCount++;
    }
    picked.push(v);
  }

  const items = picked.map<FeedItem>(v => {
    if (!personalised) {
      return { video: v, because: null };
    }
    const row = unitRow(embeddings, indexOf.get(v.id)!);
    let best = 0;
    let bestDot = -Infinity;
    likedUnits.forEach((u, k) => {
      const d = dot(u, row);
      if (d > bestDot) {
        bestDot = d;
        best = k;
      }
    });
    return { video: v, because: videos[likedIdx[best]] };
  });

  return { items, personalised };
}

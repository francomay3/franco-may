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
 * little luck mixed in, and a few from corners of the catalogue you have not
 * touched.
 *
 * What counts as taste. A like counts 1. A video you opened on YouTube (seen)
 * counts 1/3 and one saved to watch later 1/5: weaker, because they say less.
 * A video counts once, at its strongest signal, and one marked "not
 * interested" counts for nothing. Once you have likes, seen and saved together
 * can weigh at most as much as the likes, so a long watching session cannot
 * drown out what you said you liked. Every signal counts the same however old
 * it is.
 *
 * How a video is scored, for each taste:
 *   0.6 closeness to that taste + 0.2 rating + 0.2 random
 * Closeness and rating are percentile ranks within the taste's best candidates
 * (raw cosines sit in a narrow band and ratings run 0-25, so they cannot be
 * added as they are; see `bestMatch`). The random part is what now and then
 * lifts a lower-rated or slightly further-off video above a safer one.
 *
 * The signals are grouped into up to four tastes, so liking both algebra and
 * woodworking gives you both, not an average of the two that is neither. The
 * feed takes turns between the tastes in proportion to their weight.
 *
 * Every EXPLORE_EVERY-th place goes to exploration: well-rated videos far from
 * every taste, spread out from each other. What you do with them (like, save,
 * open) is how the feed learns about the parts it knows least.
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
/** With nothing to go on there is no closeness: rating leads, luck shuffles. */
const COLD_W_RATING = 0.7;
const COLD_W_NOISE = 0.3;

export const WEIGHT_LIKE = 1;
export const WEIGHT_SEEN = 1 / 3;
export const WEIGHT_SAVED = 1 / 5;

/** At most this share of the feed (and of any start of it) is already seen. */
export const SEEN_SHARE = 0.2;
const SEEN_PENALTY = 0.35;
const PER_CHANNEL = 3;
const MAX_TASTES = 4;
const DISLIKE_PENALTY = 0.5;

/** One place in this many is for exploring. */
export const EXPLORE_EVERY = 10;
/** Exploration draws from the least-covered share of the catalogue. */
const EXPLORE_REGION = 0.4;
const EXPLORE_POOL = 80;
const EXPLORE_MAX = FEED_LENGTH / EXPLORE_EVERY;
/** How hard exploration avoids repeating one far corner. */
const EXPLORE_SPREAD = 1;

export type FeedInput = {
  liked: readonly string[];
  disliked: readonly string[];
  /** Videos opened on YouTube. */
  seen: ReadonlySet<string>;
  /** Videos in the watch-later list. */
  saved: readonly string[];
  /** Fixes the luck: the same seed and inputs give the same feed. */
  seed: number;
};

export type FeedItem = {
  video: Video;
  /** The liked video this is closest to; null unless it is a liked one. */
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

export type Signal = { index: number; weight: number; liked: boolean };

/**
 * What the feed learns from: each video once, at its strongest signal, with
 * dismissed videos left out and the implicit signals held to the likes' total.
 */
export function collectSignals(
  input: FeedInput,
  indexOf: ReadonlyMap<string, number>
): Signal[] {
  const found = new Map<number, Signal>();
  const add = (id: string, weight: number, liked: boolean) => {
    const index = indexOf.get(id);
    if (index === undefined) {
      return;
    }
    const have = found.get(index);
    if (!have || weight > have.weight) {
      found.set(index, { index, weight, liked });
    }
  };
  input.seen.forEach(id => add(id, WEIGHT_SEEN, false));
  input.saved.forEach(id => add(id, WEIGHT_SAVED, false));
  input.liked.forEach(id => add(id, WEIGHT_LIKE, true));
  input.disliked.forEach(id => {
    const index = indexOf.get(id);
    if (index !== undefined) {
      found.delete(index);
    }
  });

  const all = [...found.values()];
  const likedTotal = all.filter(s => s.liked).length * WEIGHT_LIKE;
  const implicitTotal = all
    .filter(s => !s.liked)
    .reduce((sum, s) => sum + s.weight, 0);
  const scale =
    likedTotal > 0 && implicitTotal > likedTotal
      ? likedTotal / implicitTotal
      : 1;
  return all.map(s => (s.liked ? s : { ...s, weight: s.weight * scale }));
}

/**
 * Group unit vectors into up to MAX_TASTES by weighted k-means, aiming at one
 * taste per two likes' worth of weight. Starts from the heaviest vector and
 * then the one farthest from those chosen, so it is the same every time for
 * the same signals.
 */
export function clusterTastes(
  rows: Float32Array[],
  weights: number[]
): number[][] {
  const total = weights.reduce((a, b) => a + b, 0);
  const k = Math.max(
    1,
    Math.min(MAX_TASTES, Math.ceil(total / 2), rows.length)
  );
  const heaviest = weights.indexOf(Math.max(...weights));
  const centers: Float32Array[] = [rows[heaviest]];
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
            sum[d] += weights[i] * r[d];
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

  const signals = collectSignals(input, indexOf);
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

  const signalUnits = signals.map(s => unitRow(embeddings, s.index));
  const personalised = signals.length > 0;

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
  const closenessOfTaste: Float32Array[] = [];
  if (personalised) {
    const groups = clusterTastes(
      signalUnits,
      signals.map(s => s.weight)
    );
    for (const group of groups) {
      const sum = new Float32Array(DIM);
      let weight = 0;
      for (const m of group) {
        weight += signals[m].weight;
        for (let d = 0; d < DIM; d++) {
          sum[d] += signals[m].weight * signalUnits[m][d];
        }
      }
      const closeness = cosines(embeddings, normalise(sum));
      closenessOfTaste.push(closeness);
      const pool = [...eligible]
        .sort((a, b) => closeness[b] - closeness[a])
        .slice(0, POOL);
      tastes.push({
        weight,
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

  // ---- exploration ---------------------------------------------------------
  // Far from every taste, then well rated, then spread out: each pick is
  // marked down for being close to one already picked.
  let explore: Taste | null = null;
  if (personalised) {
    // How near each video is to its nearest taste; low means unexplored.
    const near = new Float32Array(videos.length).fill(-1);
    for (const c of closenessOfTaste) {
      for (let i = 0; i < near.length; i++) {
        near[i] = Math.max(near[i], c[i]);
      }
    }
    const unexplored = eligible
      .filter(i => !input.seen.has(videos[i].id))
      .sort((a, b) => near[a] - near[b])
      .slice(0, Math.ceil(eligible.length * EXPLORE_REGION));
    const ratingPct = percentiles(unexplored.map(i => videos[i].score));
    const best = unexplored
      .map((i, p) => ({ i, score: 0.7 * ratingPct[p] + 0.3 * rng() }))
      .sort((a, b) => b.score - a.score)
      .slice(0, EXPLORE_POOL);
    const rows = best.map(c => unitRow(embeddings, c.i));
    const chosen: number[] = [];
    while (chosen.length < Math.min(EXPLORE_MAX, best.length)) {
      let pick = -1;
      let pickScore = -Infinity;
      best.forEach((c, k) => {
        if (chosen.includes(k)) {
          return;
        }
        const crowd = chosen.length
          ? Math.max(...chosen.map(j => dot(rows[j], rows[k])))
          : 0;
        const score = c.score - EXPLORE_SPREAD * crowd;
        if (score > pickScore) {
          pickScore = score;
          pick = k;
        }
      });
      chosen.push(pick);
    }
    explore = {
      weight: 1,
      candidates: chosen.map((k, rank) => ({
        i: best[k].i,
        score: -rank,
      })),
      next: 0,
      taken: 0,
    };
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
    let chosen: { taste: Taste; c: Candidate } | null = null;
    if (explore && (picked.length + 1) % EXPLORE_EVERY === 0) {
      const c = take(explore);
      if (c) {
        chosen = { taste: explore, c };
      }
    }
    if (!chosen) {
      const order = [...tastes].sort(
        (a, b) => a.taken / a.weight - b.taken / b.weight
      );
      for (const t of order) {
        const c = take(t);
        if (c) {
          chosen = { taste: t, c };
          break;
        }
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

  // "Because you liked": only when the closest thing you have touched is a
  // like. Where it is a watched or saved video the suggestion simply appears.
  const items = picked.map<FeedItem>(v => {
    if (!personalised) {
      return { video: v, because: null };
    }
    const row = unitRow(embeddings, indexOf.get(v.id)!);
    let best = 0;
    let bestDot = -Infinity;
    signalUnits.forEach((u, k) => {
      const d = dot(u, row);
      if (d > bestDot) {
        bestDot = d;
        best = k;
      }
    });
    return {
      video: v,
      because: signals[best].liked ? videos[signals[best].index] : null,
    };
  });

  return { items, personalised };
}

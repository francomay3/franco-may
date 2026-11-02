import { bestMatch } from './filters';
import { DIM, type Video } from './types';

/**
 * "Similar to this" for a video or a channel, from the same embeddings the
 * search uses. Everything here is a dot product over a few thousand rows, so
 * it runs in the browser in a few milliseconds and needs no extra data.
 *
 * What it does on top of raw similarity, and why:
 *  - a small rating bias, so of two equally close videos the better-liked one
 *    wins (the same rank blend as "Best match", at a lower weight);
 *  - news videos are skipped: they only matter around one event;
 *  - near-identical titles are collapsed, because the dataset holds some talks
 *    uploaded twice, and a "similar" list of the same talk three times is not
 *    similar, it is a duplicate;
 *  - at most two per channel, so one prolific channel cannot fill the row.
 */
export type SimilarityData = {
  videos: readonly Video[];
  indexOf: ReadonlyMap<string, number>;
  /** int8, row i is videos[i], DIM values per row. */
  embeddings: Int8Array;
  related: ReadonlyMap<string, [id: string, shared: number][]>;
};

/** How much the rating counts against closeness. Small on purpose. */
export const SIMILAR_BLEND = 0.15;
const PER_CHANNEL = 2;
/** A broad channel is summarised by its best-rated videos, not all of them. */
const REFERENCE_VIDEOS = 12;

// ---- vectors ---------------------------------------------------------------

const norms = new WeakMap<Int8Array, Float32Array>();

/** Row lengths, once: quantising to int8 leaves them near, not exactly, equal. */
export function rowNorms(emb: Int8Array): Float32Array {
  let cached = norms.get(emb);
  if (!cached) {
    const n = emb.length / DIM;
    cached = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let d = 0; d < DIM; d++) {
        const x = emb[i * DIM + d];
        sum += x * x;
      }
      cached[i] = Math.sqrt(sum) || 1;
    }
    norms.set(emb, cached);
  }
  return cached;
}

export function unitRow(emb: Int8Array, i: number): Float32Array {
  const norm = rowNorms(emb)[i];
  const out = new Float32Array(DIM);
  for (let d = 0; d < DIM; d++) {
    out[d] = emb[i * DIM + d] / norm;
  }
  return out;
}

export function normalise(v: Float32Array): Float32Array {
  let sum = 0;
  for (let d = 0; d < DIM; d++) {
    sum += v[d] * v[d];
  }
  const norm = Math.sqrt(sum) || 1;
  for (let d = 0; d < DIM; d++) {
    v[d] /= norm;
  }
  return v;
}

/** Cosine of every row with a unit vector `q`, indexed like the videos. */
export function cosines(emb: Int8Array, q: Float32Array): Float32Array {
  const n = emb.length / DIM;
  const norm = rowNorms(emb);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let dot = 0;
    const base = i * DIM;
    for (let d = 0; d < DIM; d++) {
      dot += emb[base + d] * q[d];
    }
    out[i] = dot / norm[i];
  }
  return out;
}

// ---- ranking ---------------------------------------------------------------

export function titleKey(title: string): string {
  const key = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  // A title with no letters or digits at all must not collapse with others.
  return key || title;
}

export const channelKey = (v: Video) => v.channelId ?? v.channel;

/**
 * The best `limit` videos by relevance (with the rating bias), minus anything
 * excluded, any repeat of a title in `knownTitles`, and past two per channel.
 */
function rank(
  data: SimilarityData,
  relevance: Float32Array,
  exclude: (v: Video) => boolean,
  knownTitles: Iterable<string>,
  limit: number
): Video[] {
  const candidates = data.videos.filter(
    v => v.shelfLife !== 'news' && !exclude(v)
  );
  const ordered = bestMatch(candidates, relevance, data.indexOf, SIMILAR_BLEND);

  const titles = new Set([...knownTitles].map(titleKey));
  const perChannel = new Map<string, number>();
  const out: Video[] = [];
  for (const v of ordered) {
    const key = titleKey(v.title);
    const channel = channelKey(v);
    if (titles.has(key) || (perChannel.get(channel) ?? 0) >= PER_CHANNEL) {
      continue;
    }
    titles.add(key);
    perChannel.set(channel, (perChannel.get(channel) ?? 0) + 1);
    out.push(v);
    if (out.length === limit) {
      break;
    }
  }
  return out;
}

// ---- videos ----------------------------------------------------------------

/** Videos like this one, from other channels (a channel's own are listed apart). */
export function similarToVideo(
  data: SimilarityData,
  videoId: string,
  limit = 8
): Video[] {
  const i = data.indexOf.get(videoId);
  if (i === undefined) {
    return [];
  }
  const target = data.videos[i];
  const relevance = cosines(data.embeddings, unitRow(data.embeddings, i));
  return rank(
    data,
    relevance,
    v =>
      v.id === target.id ||
      (!!target.channelId && v.channelId === target.channelId),
    [target.title],
    limit
  );
}

function channelMembers(data: SimilarityData, channelId: string): number[] {
  const out: number[] = [];
  data.videos.forEach((v, i) => {
    if (v.channelId === channelId) {
      out.push(i);
    }
  });
  return out;
}

/**
 * Videos in the spirit of a channel's, from other channels.
 *
 * Two measures, averaged. Closeness to the channel's AVERAGE catches its
 * general spirit but blurs a channel that covers many things into mush;
 * closeness to its three nearest videos catches a specific theme but can latch
 * onto one series. Together they behave for both a focused channel and a broad
 * one. The second is measured against the channel's best-rated videos only,
 * which keeps a 96-video channel as cheap as a small one.
 */
export function similarToChannel(
  data: SimilarityData,
  channelId: string,
  limit = 8
): Video[] {
  const members = channelMembers(data, channelId);
  if (members.length === 0) {
    return [];
  }

  const centroid = new Float32Array(DIM);
  for (const i of members) {
    const row = unitRow(data.embeddings, i);
    for (let d = 0; d < DIM; d++) {
      centroid[d] += row[d];
    }
  }
  const toCentroid = cosines(data.embeddings, normalise(centroid));

  const reference = [...members]
    .sort((a, b) => data.videos[b].score - data.videos[a].score)
    .slice(0, REFERENCE_VIDEOS);
  const perReference = reference.map(i =>
    cosines(data.embeddings, unitRow(data.embeddings, i))
  );
  const k = Math.min(3, perReference.length);

  const n = data.videos.length;
  const relevance = new Float32Array(n);
  const column = new Float32Array(perReference.length);
  for (let j = 0; j < n; j++) {
    for (let r = 0; r < perReference.length; r++) {
      column[r] = perReference[r][j];
    }
    const top = [...column].sort((a, b) => b - a).slice(0, k);
    const nearest = top.reduce((a, b) => a + b, 0) / k;
    relevance[j] = (toCentroid[j] + nearest) / 2;
  }

  return rank(
    data,
    relevance,
    v => v.channelId === channelId,
    members.map(i => data.videos[i].title),
    limit
  );
}

// ---- channels --------------------------------------------------------------

export type SimilarChannel = {
  id: string;
  name: string;
  videos: number;
  avgRating: number;
};

type ChannelProfile = SimilarChannel & { centroid: Float32Array };

const profiles = new WeakMap<Int8Array, Map<string, ChannelProfile>>();

/** One averaged vector per channel, built once for the whole dataset. */
function channelProfiles(data: SimilarityData): Map<string, ChannelProfile> {
  let cached = profiles.get(data.embeddings);
  if (cached) {
    return cached;
  }
  const sums = new Map<
    string,
    {
      sum: Float32Array;
      names: Map<string, number>;
      videos: number;
      rating: number;
    }
  >();
  data.videos.forEach((v, i) => {
    if (!v.channelId) {
      return;
    }
    let entry = sums.get(v.channelId);
    if (!entry) {
      entry = {
        sum: new Float32Array(DIM),
        names: new Map(),
        videos: 0,
        rating: 0,
      };
      sums.set(v.channelId, entry);
    }
    const row = unitRow(data.embeddings, i);
    for (let d = 0; d < DIM; d++) {
      entry.sum[d] += row[d];
    }
    entry.videos += 1;
    entry.rating += v.score;
    entry.names.set(v.channel, (entry.names.get(v.channel) ?? 0) + 1);
  });

  cached = new Map();
  for (const [id, e] of sums) {
    const name = [...e.names.entries()].sort((a, b) => b[1] - a[1])[0][0];
    cached.set(id, {
      id,
      name,
      videos: e.videos,
      avgRating: e.rating / e.videos,
      centroid: normalise(e.sum),
    });
  }
  profiles.set(data.embeddings, cached);
  return cached;
}

const CHANNEL_POOL = 40;

/**
 * Channels whose videos sit near this channel's, closest first, with the same
 * small bias towards better-rated ones. Compared by averaged vector, since a
 * channel as a whole is what is being matched.
 */
export function similarChannels(
  data: SimilarityData,
  channelId: string,
  limit = 6
): SimilarChannel[] {
  const all = channelProfiles(data);
  const target = all.get(channelId);
  if (!target) {
    return [];
  }

  const scored: { p: ChannelProfile; cos: number }[] = [];
  for (const p of all.values()) {
    if (p.id === channelId) {
      continue;
    }
    let dot = 0;
    for (let d = 0; d < DIM; d++) {
      dot += p.centroid[d] * target.centroid[d];
    }
    scored.push({ p, cos: dot });
  }
  scored.sort((a, b) => b.cos - a.cos);
  const pool = scored.slice(0, CHANNEL_POOL);

  // Rank blend within the pool, as for videos: closeness leads, rating nudges.
  const byRating = [...pool].sort((a, b) => a.p.avgRating - b.p.avgRating);
  const ratingRank = new Map(
    byRating.map((s, i) => [
      s.p.id,
      pool.length > 1 ? i / (pool.length - 1) : 0,
    ])
  );
  const final = new Map(
    pool.map((s, i) => [
      s.p.id,
      (1 - SIMILAR_BLEND) * (pool.length > 1 ? 1 - i / (pool.length - 1) : 1) +
        SIMILAR_BLEND * ratingRank.get(s.p.id)!,
    ])
  );
  return pool
    .sort((a, b) => final.get(b.p.id)! - final.get(a.p.id)!)
    .slice(0, limit)
    .map(({ p }) => ({
      id: p.id,
      name: p.name,
      videos: p.videos,
      avgRating: p.avgRating,
    }));
}

// ---- Hacker News -----------------------------------------------------------

/**
 * Videos recommended by the same HN commenters as this one. Taste overlap, not
 * topic, so it can surface things the embeddings would never put together.
 * Only about 58% of videos have any.
 */
export function coRecommended(
  data: SimilarityData,
  videoId: string,
  limit = 6
): { video: Video; shared: number }[] {
  const out: { video: Video; shared: number }[] = [];
  for (const [id, shared] of data.related.get(videoId) ?? []) {
    const i = data.indexOf.get(id);
    if (i !== undefined) {
      out.push({ video: data.videos[i], shared });
    }
    if (out.length === limit) {
      break;
    }
  }
  return out;
}

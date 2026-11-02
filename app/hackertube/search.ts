import { DIM } from './types';

/**
 * Semantic search, entirely in the browser.
 *
 * The stored vectors came from BAAI/bge-small-en-v1.5 with no instruction
 * prefix, so the query has to go through the same model, the same way (CLS
 * pooling, normalised). The model is Xenova's quantised ONNX build, which is
 * the same family as the one the vectors were made with; ranking differences
 * are far below what a person would notice.
 *
 * Loaded on the first query only. It is a ~35 MB download that the browser
 * then caches, and nobody who never searches should pay for it.
 */
type Embed = (
  text: string,
  options: { pooling: 'cls'; normalize: boolean }
) => Promise<{ data: Float32Array }>;

let embedder: Promise<Embed> | null = null;

function load(): Promise<Embed> {
  embedder ??= import('@huggingface/transformers').then(
    async ({ pipeline }) =>
      (await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
        dtype: 'q8',
      })) as unknown as Embed
  );
  // A failed load must not be remembered, or search is dead until a reload.
  embedder.catch(() => {
    embedder = null;
  });
  return embedder;
}

export async function embedQuery(query: string): Promise<Float32Array> {
  const embed = await load();
  const out = await embed(query, { pooling: 'cls', normalize: true });
  return out.data;
}

/** Dot product of the query with every stored vector, indexed like the videos. */
export function similarities(
  query: Float32Array,
  matrix: Int8Array
): Float32Array {
  const n = matrix.length / DIM;
  const sims = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let dot = 0;
    const base = i * DIM;
    for (let d = 0; d < DIM; d++) {
      dot += matrix[base + d] * query[d];
    }
    sims[i] = dot / 127;
  }
  return sims;
}

function zscores(values: Float32Array): Float32Array {
  const n = values.length;
  let mean = 0;
  for (let i = 0; i < n; i++) {
    mean += values[i];
  }
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) {
    variance += (values[i] - mean) ** 2;
  }
  const sd = Math.sqrt(variance / n) || 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = (values[i] - mean) / sd;
  }
  return out;
}

/**
 * The positive query's similarity, pulled down where a video is unusually
 * close to the negative one.
 *
 * Raw similarities are no good for subtracting: this model scores everything
 * in a narrow, high band, so "close to the negative query" would mostly mean
 * "close to anything". Both are put in standard deviations from the typical
 * video first, and only videos MORE related to the negative query than
 * average are penalised -- being unrelated to it earns no bonus. `strength`
 * is 0..1 and maps onto a penalty of `strength * 2` per standard deviation,
 * so the default 0.5 takes one standard deviation of relevance off for every
 * standard deviation a video sits above average closeness to the negative.
 */
export function combineRelevance(
  positive: Float32Array | null,
  negative: Float32Array | null,
  strength: number
): Float32Array | null {
  if (!positive) {
    return null;
  }
  if (!negative || strength <= 0) {
    return positive;
  }
  const zPos = zscores(positive);
  const zNeg = zscores(negative);
  const alpha = strength * 2;
  const out = new Float32Array(positive.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = zPos[i] - alpha * Math.max(0, zNeg[i]);
  }
  return out;
}

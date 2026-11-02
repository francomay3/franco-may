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

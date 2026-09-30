/**
 * Pairwise rank for the admin tinder.
 *
 * Two layers, and they are not the same thing. The prior is the place's
 * current score: with no votes, that is the whole prediction, pulled toward
 * an even chance so a gap in the old score does not read as certainty.
 * The learned layer is a logistic on the difference of signals, fitted only
 * on decisive votes. A skip is stored and never becomes a row of that fit.
 *
 * Visitors and Wikipedia reads are not in the signal list. The first is
 * the label the big score already over-fit. The second is how the top of
 * the export is already ordered, and this pool sits below that cut.
 *
 * The names and order of FEATURES are the contract with
 * fornlamningar/export_compare_pool.py. A pool file whose header disagrees
 * is refused rather than silently scored against the wrong column.
 */

export const FEATURES = [
  'has_name',
  'any_visible',
  'has_image',
  'has_commons',
  'has_wl_image',
  'log_len',
  'log_height',
  'log_area',
  'log_desc',
  'log_sites',
  'board_close',
] as const;

/** Decisive votes before the shown number is allowed to say "your votes". */
export const VOTES_BEFORE_LEARNED = 24;

/** Pseudo-counts of the prior. At 24 real votes the learned layer is 3/8 of the mix. */
const PRIOR_WEIGHT = 40;

/** Score points that move the prior by one logit. */
const PRIOR_TEMPERATURE = 4;

/** How far the prior is pulled toward 50% before it is shown. */
const PRIOR_SHRINK = 0.65;

const L2 = 8;
const FIT_ITERS = 800;

export type CompareSite = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lon: number;
  score: number;
  views: number | null;
  f: number[];
  residual: number;
};

export type Vote = {
  left: string;
  right: string;
  outcome: 'left' | 'right' | 'skip';
};

export type Basis = 'prior' | 'votes';

export type Fit = {
  w: number[];
  b: number;
  mean: number[];
  std: number[];
};

function sigmoid(z: number): number {
  const c = Math.max(-30, Math.min(30, z));
  return 1 / (1 + Math.exp(-c));
}

export function featureStats(sites: { f: number[] }[]): {
  mean: number[];
  std: number[];
} {
  const d = FEATURES.length;
  const mean = Array(d).fill(0);
  const n = sites.length || 1;
  for (const s of sites) {
    for (let j = 0; j < d; j++) {
      mean[j] += s.f[j] / n;
    }
  }
  const variance = Array(d).fill(0);
  for (const s of sites) {
    for (let j = 0; j < d; j++) {
      const diff = s.f[j] - mean[j];
      variance[j] += (diff * diff) / n;
    }
  }
  return { mean, std: variance.map(v => Math.sqrt(v) || 1) };
}

function z(f: number[], mean: number[], std: number[]): number[] {
  return f.map((v, j) => (v - mean[j]) / std[j]);
}

/** score z minus a fixed glance index. High means the old score rates it above how it looks on paper. */
export function residuals(
  sites: CompareSite[],
  mean: number[],
  std: number[]
): void {
  const glanceOf = (s: CompareSite) => {
    const g = z(s.f, mean, std);
    return g[0] + g[1] + g[2] + g[3] + 0.5 * g[6] + 0.3 * g[5];
  };
  const scores = sites.map(s => s.score);
  const glances = sites.map(glanceOf);
  const zs = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length || 1);
    const s = Math.sqrt(v) || 1;
    return xs.map(x => (x - m) / s);
  };
  const sz = zs(scores);
  const gz = zs(glances);
  sites.forEach((s, i) => {
    s.residual = sz[i] - gz[i];
  });
}

function fitLogistic(X: number[][], y: number[]): { w: number[]; b: number } {
  const n = X.length;
  const d = FEATURES.length;
  const w = Array(d).fill(0);
  let b = 0;
  const vw = Array(d).fill(0);
  let vb = 0;
  const lr = 0.35;
  const mom = 0.9;
  for (let it = 0; it < FIT_ITERS; it++) {
    const gw = Array(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      let dot = b;
      for (let j = 0; j < d; j++) {
        dot += X[i][j] * w[j];
      }
      const resid = (sigmoid(dot) - y[i]) / n;
      for (let j = 0; j < d; j++) {
        gw[j] += X[i][j] * resid;
      }
      gb += resid;
    }
    for (let j = 0; j < d; j++) {
      gw[j] += (L2 * w[j]) / n;
      vw[j] = mom * vw[j] - lr * gw[j];
      w[j] += vw[j];
    }
    vb = mom * vb - lr * gb;
    b += vb;
  }
  return { w, b };
}

export function fitVotes(
  byId: Map<string, CompareSite>,
  votes: Vote[],
  mean: number[],
  std: number[]
): Fit | null {
  const X: number[][] = [];
  const y: number[] = [];
  for (const v of votes) {
    if (v.outcome === 'skip') {
      continue;
    }
    const left = byId.get(v.left);
    const right = byId.get(v.right);
    if (!left || !right) {
      continue;
    }
    const a = z(left.f, mean, std);
    const b = z(right.f, mean, std);
    X.push(a.map((value, j) => value - b[j]));
    y.push(v.outcome === 'left' ? 1 : 0);
  }
  if (X.length < 2) {
    return null;
  }
  const { w, b } = fitLogistic(X, y);
  return { w, b, mean, std };
}

export function decisiveCount(votes: Vote[]): number {
  return votes.filter(v => v.outcome !== 'skip').length;
}

function priorLogit(left: CompareSite, right: CompareSite): number {
  return (left.score - right.score) / PRIOR_TEMPERATURE;
}

/**
 * P(left is the more striking), and which layer the number is allowed to claim.
 * Computed from `votes` as they stand. The caller records the new vote after.
 */
export function predict(
  left: CompareSite,
  right: CompareSite,
  votes: Vote[],
  fit: Fit | null
): { pLeft: number; basis: Basis } {
  const prior = sigmoid(priorLogit(left, right));
  const shownPrior = 0.5 + (prior - 0.5) * PRIOR_SHRINK;
  const n = decisiveCount(votes);
  if (n < VOTES_BEFORE_LEARNED || !fit) {
    return { pLeft: shownPrior, basis: 'prior' };
  }
  const a = z(left.f, fit.mean, fit.std);
  const b = z(right.f, fit.mean, fit.std);
  let dot = fit.b;
  for (let j = 0; j < FEATURES.length; j++) {
    dot += (a[j] - b[j]) * fit.w[j];
  }
  const learned = sigmoid(dot);
  const mix = n / (n + PRIOR_WEIGHT);
  return { pLeft: (1 - mix) * shownPrior + mix * learned, basis: 'votes' };
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * A pair close in the current score, where the score and the glance signals
 * disagree. Once the learned layer is allowed to speak, pairs it is unsure
 * about are preferred. The same pair is never asked twice. Nothing here is
 * random, so a refresh before voting shows the same one.
 */
export function pickPair(
  sites: CompareSite[],
  votes: Vote[],
  fit: Fit | null
): [CompareSite, CompareSite] | null {
  if (sites.length < 2) {
    return null;
  }
  const used = new Set(votes.map(v => pairKey(v.left, v.right)));
  const last = votes.length ? votes[votes.length - 1] : null;
  const recent = new Set(last ? [last.left, last.right] : []);
  const n = decisiveCount(votes);
  const order = [...sites].sort((a, b) => a.score - b.score);
  let best: [CompareSite, CompareSite] | null = null;
  let bestQ = -1;
  for (let i = 0; i < order.length; i++) {
    for (let k = 1; k <= 20 && i + k < order.length; k++) {
      const a = order[i];
      const b = order[i + k];
      const gap = b.score - a.score;
      if (gap > 6) {
        break;
      }
      if (used.has(pairKey(a.id, b.id))) {
        continue;
      }
      const close = 1 / (1 + gap);
      const disagree = Math.abs(a.residual - b.residual);
      let q = close * (0.35 + disagree);
      if (n >= VOTES_BEFORE_LEARNED && fit) {
        const p = predict(a, b, votes, fit).pLeft;
        const unsure = 1 - Math.abs(2 * p - 1);
        q = close * (0.25 + unsure) + 0.2 * disagree;
      }
      if (recent.has(a.id) || recent.has(b.id)) {
        q *= 0.2;
      }
      if (q > bestQ) {
        bestQ = q;
        best = [a, b];
      }
    }
  }
  return best;
}

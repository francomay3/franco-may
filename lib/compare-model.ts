/**
 * Pairwise rank for the admin tinder.
 *
 * One layer. A logistic on the difference of the signals that lined up
 * with Franco's votes: a name, a visible monument, photographs, standing
 * away from buildings and roads, sitting near a mapped monument. The old
 * score is not in it. The pairs he is shown are already tied on that
 * score, so a score gap reads as a coin flip and shrinks a real signal
 * down to nothing.
 *
 * With too few decisive votes the number is an even chance. After that it
 * is the fit as it stands, and a strong penalty keeps it from claiming
 * more than the votes can support. A tie is a vote that the two are
 * equal. A skip is stored and never becomes a row of that fit.
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
  'n_images',
  'log_len',
  'log_height',
  'log_area',
  'log_desc',
  'far_building',
  'far_road',
  'near_monument',
  'near_viewpoint',
  'docs',
  'sitelinks',
] as const;

/** Decisive votes before the shown number is allowed to say "your votes". */
export const VOTES_BEFORE_LEARNED = 24;

/**
 * L2 on the standardized differences. The chronological check on the
 * existing votes only became better than a coin after about sixty of
 * them, and a lighter penalty was already over-confident before that.
 */
const L2 = 12;
const FIT_ITERS = 800;

const featureIndex = Object.fromEntries(
  FEATURES.map((name, i) => [name, i])
) as Record<(typeof FEATURES)[number], number>;

/** Signals that say "someone documented this". */
const DOCUMENTED = [
  'has_name',
  'any_visible',
  'has_image',
  'has_commons',
  'n_images',
  'near_monument',
] as const;

/** Signals that say "it stands out in the landscape". High means farther. */
const REMOTE = ['far_building', 'far_road'] as const;

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
  outcome: 'left' | 'right' | 'tie' | 'skip';
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
    y.push(v.outcome === 'left' ? 1 : v.outcome === 'tie' ? 0.5 : 0);
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

/**
 * P(left is the more striking), and which layer the number is allowed to claim.
 * Computed from `votes` as they stand. The caller records the new vote after.
 * Before there are enough votes the number is an even chance: the old score
 * does not get to stand in for one.
 */
export function predict(
  left: CompareSite,
  right: CompareSite,
  votes: Vote[],
  fit: Fit | null
): { pLeft: number; basis: Basis } {
  const n = decisiveCount(votes);
  if (n < VOTES_BEFORE_LEARNED || !fit) {
    return { pLeft: 0.5, basis: 'prior' };
  }
  const a = z(left.f, fit.mean, fit.std);
  const b = z(right.f, fit.mean, fit.std);
  let dot = fit.b;
  for (let j = 0; j < FEATURES.length; j++) {
    dot += (a[j] - b[j]) * fit.w[j];
  }
  return { pLeft: sigmoid(dot), basis: 'votes' };
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** How many recent comparisons a site sits out. One outlier was otherwise the best partner for every neighbour, and it stayed on screen. */
const REST_FOR = 8;

function present(a: CompareSite, b: CompareSite): [CompareSite, CompareSite] {
  const key = pairKey(a.id, b.id);
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(h, 33) + key.charCodeAt(i)) >>> 0;
  }
  return h % 2 === 0 ? [a, b] : [b, a];
}

type Placed = {
  site: CompareSite;
  g: number[];
  doc: number;
  remote: number;
  axis: number;
};

function placeAll(sites: CompareSite[], fit: Fit | null): Placed[] {
  const stats = fit ?? featureStats(sites);
  const mean = stats.mean;
  const std = stats.std;
  return sites.map(site => {
    const g = z(site.f, mean, std);
    let doc = 0;
    for (const name of DOCUMENTED) {
      doc += g[featureIndex[name]];
    }
    doc /= DOCUMENTED.length;
    let remote = 0;
    for (const name of REMOTE) {
      remote += g[featureIndex[name]];
    }
    remote /= REMOTE.length;
    let axis = doc - remote;
    if (fit) {
      axis = fit.b;
      for (let j = 0; j < FEATURES.length; j++) {
        axis += g[j] * fit.w[j];
      }
    }
    return { site, g, doc, remote, axis };
  });
}

/** One side is documented and close in; the other stands apart and is barely recorded. */
function contradiction(a: Placed, b: Placed): number {
  return (
    Math.max(0, a.doc - b.doc) * Math.max(0, b.remote - a.remote) +
    Math.max(0, b.doc - a.doc) * Math.max(0, a.remote - b.remote)
  );
}

function featureGap(a: Placed, b: Placed): number {
  let sum = 0;
  for (let j = 0; j < FEATURES.length; j++) {
    sum += Math.abs(a.g[j] - b.g[j]);
  }
  return sum / FEATURES.length;
}

/**
 * A mixed queue. Most pairs are ones the model cannot separate, chosen so
 * the signals point opposite ways: that is what still moves the weights.
 * Every third comparison is one it is already sure about and whose signals
 * disagree, so a systematic mistake gets a chance to be corrected. Sure
 * pairs alone would only confirm the guess. The same pair is never asked
 * twice, and a site that was just shown sits out the next few so the
 * screen changes. Runestones are down-weighted: they look alike, so a
 * pair of them rarely teaches anything, and one of them is asked less
 * often than another kind. Nothing here is random, so a refresh before
 * voting shows the same one. Which side a place stands on is fixed for
 * that pair and is not "the higher score".
 */

/** A runestone against anything is a duller question than two different kinds. */
function runeWeight(a: CompareSite, b: CompareSite): number {
  const ar = a.kind === 'Runristning';
  const br = b.kind === 'Runristning';
  if (ar && br) {
    return 0.04;
  }
  if (ar || br) {
    return 0.45;
  }
  return 1;
}

export function pickPair(
  sites: CompareSite[],
  votes: Vote[],
  fit: Fit | null
): [CompareSite, CompareSite] | null {
  if (sites.length < 2) {
    return null;
  }
  const used = new Set(votes.map(v => pairKey(v.left, v.right)));
  const order = placeAll(sites, fit).sort((a, b) => a.axis - b.axis);
  const wantSure = votes.length % 3 === 2;
  const search = (rest: number, sure: boolean) => {
    const resting = new Set<string>();
    for (const v of votes.slice(-rest)) {
      resting.add(v.left);
      resting.add(v.right);
    }
    let best: [CompareSite, CompareSite] | null = null;
    let bestQ = -1;
    const span = Math.max(40, Math.floor(order.length / 8));
    const step = sure ? 11 : 1;
    const near = sure ? 0 : 12;
    for (let i = 0; i < order.length; i += step) {
      const last = sure
        ? Math.min(order.length - 1, i + span)
        : Math.min(order.length - 1, i + near);
      for (let j = sure ? last : i + 1; j <= last; j++) {
        const a = order[i];
        const b = order[j];
        if (resting.has(a.site.id) || resting.has(b.site.id)) {
          continue;
        }
        if (used.has(pairKey(a.site.id, b.site.id))) {
          continue;
        }
        const p = predict(a.site, b.site, votes, fit).pLeft;
        const lean = Math.abs(2 * p - 1);
        const contra = contradiction(a, b);
        const gap = featureGap(a, b);
        const q =
          (sure
            ? lean * (0.3 + Math.min(contra, 2))
            : (1 - lean) * (0.35 + Math.min(gap, 1.5)) + 0.45 * contra) *
          runeWeight(a.site, b.site);
        if (q > bestQ) {
          bestQ = q;
          best = present(a.site, b.site);
        }
      }
    }
    return best;
  };
  return (
    search(REST_FOR, wantSure) ??
    search(REST_FOR, !wantSure) ??
    search(0, false)
  );
}

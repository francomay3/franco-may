import { type Rgb, deltaE2000, rgbToLab } from './color';
import mixbox from './mixbox';

export type Pigment = { name: string; rgb: Rgb };

/** The default palette from Impasto: nine of its sixteen pigments. */
export const PIGMENTS: Pigment[] = [
  { name: 'Titanium White', rgb: [252, 255, 240] },
  { name: 'Ivory Black', rgb: [12, 11, 10] },
  { name: 'Cadmium Yellow', rgb: [254, 236, 0] },
  { name: 'Cadmium Red', rgb: [255, 39, 2] },
  { name: 'Quinacridone Magenta', rgb: [128, 2, 46] },
  { name: 'Ultramarine Blue', rgb: [25, 0, 89] },
  { name: 'Cobalt Blue', rgb: [0, 33, 133] },
  { name: 'Sap Green', rgb: [107, 148, 4] },
  { name: 'Burnt Sienna', rgb: [123, 72, 0] },
];

export type MixPart = { name: string; rgb: Rgb; percent: number };
export type Recipe = { parts: MixPart[]; result: Rgb; delta: number };

const MIN_PERCENT = 2;
/** Below this distance (CIEDE2000) the eye cannot really tell the two apart. */
const GOOD_ENOUGH = 4;

const latents = new Map<string, number[]>();
const latentOf = (p: Pigment) => {
  let latent = latents.get(p.name);
  if (!latent) {
    latent = mixbox.rgbToLatent(...p.rgb);
    latents.set(p.name, latent);
  }
  return latent;
};

/** Paint mixing is not averaging: Mixbox mixes in a space trained on real pigments. */
function mix(combo: Pigment[], weights: number[]): Rgb {
  const z = new Array<number>(mixbox.LATENT_SIZE).fill(0);
  combo.forEach((p, i) => {
    const latent = latentOf(p);
    for (let j = 0; j < z.length; j++) {
      z[j] += weights[i] * latent[j];
    }
  });
  const [r, g, b] = mixbox.latentToRgb(z);
  return [r, g, b];
}

const normalize = (v: number[]) => {
  const clamped = v.map(x => Math.max(1e-6, x));
  const sum = clamped.reduce((a, b) => a + b, 0);
  return clamped.map(x => x / sum);
};

/** Nelder-Mead on the simplex of weights, as in Impasto. */
function optimize(
  objective: (w: number[]) => number,
  n: number,
  maxIter = 120
) {
  const evaluate = (v: number[]) => objective(normalize(v));
  const points: number[][] = [Array(n).fill(1)];
  for (let i = 0; i < n; i++) {
    const v: number[] = Array(n).fill(1);
    v[i] += 0.3 * n;
    points.push(v);
  }
  const values = points.map(evaluate);

  for (let iter = 0; iter < maxIter; iter++) {
    const order = [...Array(n + 1).keys()].sort(
      (a, b) => values[a] - values[b]
    );
    const P = order.map(i => points[i]);
    const V = order.map(i => values[i]);
    if (V[n] - V[0] < 1e-6) {
      break;
    }

    const centroid: number[] = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += P[i][j] / n;
      }
    }

    const reflected = centroid.map((c, j) => c + (c - P[n][j]));
    const fr = evaluate(reflected);
    if (fr < V[0]) {
      const expanded = centroid.map((c, j) => c + 2 * (reflected[j] - c));
      const fe = evaluate(expanded);
      P[n] = fe < fr ? expanded : reflected;
      V[n] = Math.min(fe, fr);
    } else if (fr < V[n - 1]) {
      P[n] = reflected;
      V[n] = fr;
    } else {
      const contracted = centroid.map((c, j) => c + 0.5 * (P[n][j] - c));
      const fc = evaluate(contracted);
      if (fc < V[n]) {
        P[n] = contracted;
        V[n] = fc;
      } else {
        for (let i = 1; i <= n; i++) {
          P[i] = P[0].map((x, j) => x + 0.5 * (P[i][j] - x));
          V[i] = evaluate(P[i]);
        }
      }
    }
    P.forEach((p, i) => {
      points[i] = p;
      values[i] = V[i];
    });
  }
  return normalize(points[values.indexOf(Math.min(...values))]);
}

const combinations = <T>(items: T[], k: number): T[][] =>
  k === 0
    ? [[]]
    : items.flatMap((item, i) =>
        combinations(items.slice(i + 1), k - 1).map(rest => [item, ...rest])
      );

/** The best one, two or three pigment mix for a color, stopping early when it is close enough. */
export function findRecipe(
  target: Rgb,
  pigments: Pigment[] = PIGMENTS
): Recipe {
  const targetLab = rgbToLab(target);
  const distanceTo = (rgb: Rgb) => deltaE2000(rgbToLab(rgb), targetLab);

  let best: Recipe = { parts: [], result: pigments[0].rgb, delta: Infinity };
  for (const p of pigments) {
    const delta = distanceTo(p.rgb);
    if (delta < best.delta) {
      best = {
        parts: [{ name: p.name, rgb: p.rgb, percent: 100 }],
        result: p.rgb,
        delta,
      };
    }
  }

  for (const n of [2, 3]) {
    if (best.delta < GOOD_ENOUGH) {
      break;
    }
    for (const combo of combinations(pigments, n)) {
      const weights = optimize(w => distanceTo(mix(combo, w)), n);
      // Drop pigments that barely contribute and settle the rest again.
      const kept = combo
        .map((p, i) => ({ p, w: weights[i] }))
        .filter(({ w }) => w >= MIN_PERCENT / 100);
      if (kept.length < 2) {
        continue;
      }
      const finalCombo = kept.map(k => k.p);
      const finalWeights =
        kept.length === n
          ? weights
          : optimize(w => distanceTo(mix(finalCombo, w)), kept.length);
      const result = mix(finalCombo, finalWeights);
      const delta = distanceTo(result);
      if (delta < best.delta) {
        best = {
          parts: finalCombo.map((p, i) => ({
            name: p.name,
            rgb: p.rgb,
            percent: Math.round(finalWeights[i] * 100),
          })),
          result,
          delta,
        };
      }
      if (best.delta < GOOD_ENOUGH) {
        break;
      }
    }
  }

  best.parts.sort((a, b) => b.percent - a.percent);
  return best;
}

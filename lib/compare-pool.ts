import { readFileSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
import {
  FEATURES,
  featureStats,
  residuals,
  type CompareSite,
} from '@/lib/compare-model';

/**
 * The tinder's pool, written by fornlamningar/export_compare_pool.py.
 *
 * Held in the process the way the score file is. Voting does not change it.
 * A new pipeline export does, and the next cold start picks that up; a long
 * -lived process keeps the copy it read, which is the same trade the score
 * list already makes.
 */

export type ComparePool = {
  sites: CompareSite[];
  byId: Map<string, CompareSite>;
  mean: number[];
  std: number[];
};

const globalForPool = globalThis as unknown as { flComparePool?: ComparePool };

function load(): ComparePool {
  const path = join(process.cwd(), 'data', 'compare-pool.jsonl.gz');
  const raw = gunzipSync(readFileSync(path)).toString('utf8');
  const lines = raw.split('\n').filter(Boolean);
  const header = JSON.parse(lines[0]) as { v?: number; features?: string[] };
  const names = header.features ?? [];
  if (
    header.v !== 1 ||
    names.length !== FEATURES.length ||
    names.some((name, i) => name !== FEATURES[i])
  ) {
    throw new Error('compare pool features do not match compare-model.ts');
  }
  const sites: CompareSite[] = [];
  for (const line of lines.slice(1)) {
    const row = JSON.parse(line) as {
      id: string;
      name: string;
      kind: string;
      lat: number;
      lon: number;
      score: number;
      views: number | null;
      f: number[];
    };
    if (!row.id || row.f.length !== FEATURES.length) {
      continue;
    }
    sites.push({ ...row, residual: 0 });
  }
  const { mean, std } = featureStats(sites);
  residuals(sites, mean, std);
  return { sites, byId: new Map(sites.map(s => [s.id, s])), mean, std };
}

export function comparePool(): ComparePool {
  if (!globalForPool.flComparePool) {
    globalForPool.flComparePool = load();
  }
  return globalForPool.flComparePool;
}

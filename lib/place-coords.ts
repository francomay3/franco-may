import { gunzipSync } from 'zlib';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Representative-site uuid to the cluster centroid.
 *
 * Built from the pipeline's `clusters` table (rep_uuid, lon, lat), which is
 * the same point the map pin uses. The admin page is the only reader. Loaded
 * once: a quarter of a million lines, a few megabytes gzipped.
 *
 * Lines are `uuid lon lat`, five decimal places. Regenerated from
 * `clusters` in the pipeline's work.sqlite when those centroids move.
 */

let index: Map<string, [number, number]> | null = null;

function load(): Map<string, [number, number]> {
  if (index) return index;
  const raw = gunzipSync(
    readFileSync(join(process.cwd(), 'data', 'place-coords.txt.gz'))
  ).toString('utf8');
  const map = new Map<string, [number, number]>();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    const [uuid, lon, lat] = line.split(' ');
    const x = Number(lon);
    const y = Number(lat);
    if (uuid && Number.isFinite(x) && Number.isFinite(y)) {
      map.set(uuid, [x, y]);
    }
  }
  index = map;
  return map;
}

/** [lon, lat], or null when this uuid is not a place the map knows. */
export function placeCoord(uuid: string): [number, number] | null {
  return load().get(uuid.toLowerCase()) ?? null;
}

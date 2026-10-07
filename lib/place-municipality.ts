import { gunzipSync } from 'zlib';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Representative-site uuid to the municipality the register records.
 *
 * Built from the pipeline's `clusters` table (rep_uuid, municipality).
 * The admin search quotes the place title and adds this name, because the
 * same title turns up in several kommuner. Loaded once.
 *
 * Lines are `uuid<tab>municipality`. Regenerated from `clusters` in the
 * pipeline's work.sqlite when those names move.
 */

let index: Map<string, string> | null = null;

function load(): Map<string, string> {
  if (index) {
    return index;
  }
  const map = new Map<string, string>();
  try {
    const raw = gunzipSync(
      readFileSync(join(process.cwd(), 'data', 'place-municipalities.txt.gz'))
    ).toString('utf8');
    for (const line of raw.split('\n')) {
      if (!line) {
        continue;
      }
      const tab = line.indexOf('\t');
      if (tab <= 0) {
        continue;
      }
      const uuid = line.slice(0, tab);
      const name = line.slice(tab + 1);
      if (uuid && name) {
        map.set(uuid, name);
      }
    }
  } catch {
    // A checkout without the lookup still opens the place. The search
    // then uses the title alone.
  }
  index = map;
  return map;
}

/** The municipality name, or null when this uuid is not in the lookup. */
export function placeMunicipality(uuid: string): string | null {
  return load().get(uuid.toLowerCase()) ?? null;
}

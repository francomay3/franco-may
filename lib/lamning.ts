import { gunzipSync } from 'zlib';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Lamningsnummer to the uuid the app files contributions under.
 *
 * The phone never sends L1997:4707. It sends the cluster's representative
 * uuid, which is what fl_events.place_uuid holds. The register number is
 * what a person types. The index is built from the pipeline's sites table;
 * this file only reads it.
 *
 * Loaded once. 300,000 lines is a few megabytes gzipped and the moderation
 * page is the only reader, so it does not belong in the request path of the
 * map.
 */
let index: Map<string, string> | null = null;

function load(): Map<string, string> {
  if (index) {
    return index;
  }
  const raw = gunzipSync(
    readFileSync(join(process.cwd(), 'data', 'lamning-index.txt.gz'))
  ).toString('utf8');
  const map = new Map<string, string>();
  for (const line of raw.split('\n')) {
    if (!line) {
      continue;
    }
    const space = line.indexOf(' ');
    if (space < 0) {
      continue;
    }
    map.set(line.slice(0, space), line.slice(space + 1));
  }
  index = map;
  return map;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A register number or a uuid, to the uuid contributions are stored under.
 * Null when the number is not in the register.
 */
export function placeUuidOf(query: string): string | null {
  const q = query.trim();
  if (UUID.test(q)) {
    return q.toLowerCase();
  }
  return load().get(q.toUpperCase()) ?? null;
}

/**
 * Register uuids that start with `prefix`.
 *
 * The sites table shows the first eight characters of the uuid, and that is
 * what gets pasted. Null when more than `limit` match: a short prefix of
 * 300,000 places is not an id, and the caller should search the text instead.
 */
export function placeUuidsByPrefix(
  prefix: string,
  limit: number
): string[] | null {
  const p = prefix.toLowerCase();
  const seen = new Set<string>();
  for (const uuid of load().values()) {
    if (!uuid.startsWith(p) || seen.has(uuid)) {
      continue;
    }
    seen.add(uuid);
    if (seen.size > limit) {
      return null;
    }
  }
  return [...seen];
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

/**
 * The register's places nearest to a point -- including the ones the map
 * does not show.
 *
 * WHAT IT IS FOR. Long-press on the map, "add a site", and the app asks this:
 * which of the register's places is the person standing in front of? The
 * phone cannot answer it, and not for want of data -- it carries the top
 * 10,000 by score inside vector tiles, and by construction the answer here is
 * usually a place the score left OUT. That is the whole reason fl_places
 * exists on the server. See section 9 of the pipeline's TODO.md.
 *
 * Choosing one of these is the most valuable label this project can collect:
 * somebody went, and found it, without the app sending them. Unlike a visit
 * to a place we put on the map, it has no selection bias.
 *
 * A POST, FOR A READ, AND THAT IS ON PURPOSE. The argument is the one this
 * service already makes about the author id: a secret travels in a header
 * and never in a URL, "where it would land in access logs". A person's
 * position at a moment in time is at least as sensitive as their pseudonym,
 * and `?lon=12.07&lat=57.49` puts it in every proxy log and Referer between
 * here and the phone, for ever, for a request nobody can cache anyway --
 * every call has a different position. A GET would buy edge caching that can
 * never hit. So: the position goes in the body.
 *
 * NO ACCOUNT NEEDED. Everything returned is public register data from
 * Riksantikvarieämbetet. The account requirement in /events is about
 * WRITING -- an anonymous id is minted, not held, so it cannot carry a claim
 * -- and reading the register makes no claim. The `verified` event that
 * follows a choice made here is a write, and that one will need one.
 *
 * NO RATE LIMIT, deliberately, where /events has one. What a limit would
 * protect is a dataset that is already published openly by the authority we
 * got it from; the expensive thing to protect is the write log, and that is
 * a different route.
 */

const body = z.object({
  lon: z.number().gte(-180).lte(180),
  lat: z.number().gte(-90).lte(90),
  n: z.number().int().gte(1).lte(25).default(10),
});

/**
 * How far to look, in metres, growing until something is found.
 *
 * Starting small is what keeps this fast: the bounding box below is an index
 * range, so a 2 km box reads a handful of pages and a 100 km box reads a
 * large part of the table. In inhabited Sweden the first ring almost always
 * answers -- around Kungsbacka a 2 km box holds 36 candidates -- and the
 * wider rings exist for the person standing in a forest in Norrland, who is
 * exactly the person this feature is for.
 *
 * The last ring is deliberately absurd: if there is nothing within 200 km the
 * honest answer is an empty list, and it is better to spend one slow query
 * proving that than to make "nothing nearby" indistinguishable from a bug.
 */
const RINGS_M = [2_000, 10_000, 50_000, 200_000];

const DEG_LAT_M = 111_320;

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'expected a JSON body' },
      { status: 400 }
    );
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'bad request' },
      { status: 400 }
    );
  }
  const { lon, lat, n } = parsed.data;

  // A degree of longitude is 111 km at the equator and 60 km at Kiruna, so a
  // square box in degrees is a tall thin box in metres up there. Dividing by
  // cos(lat) makes the box square in METRES, which is what the radius means.
  // Clamped because cos goes to zero at the pole and the box would become the
  // whole world; at 89 degrees it is already the whole width of Sweden.
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.05);

  for (const radius of RINGS_M) {
    const dLat = radius / DEG_LAT_M;
    const dLon = radius / (DEG_LAT_M * cos);
    // The distance is computed twice -- once to order by and once to return --
    // because naming it in the SELECT does not make it available to ORDER BY
    // in a single query, and a subquery to name it once would read worse than
    // the repetition. Haversine and not PostGIS: see the table's comment in
    // scripts/fornlamningar-events.sql.
    const { rows } = await pool.query(
      `SELECT cluster_id, lon, lat, family, class_sv, name, title, blurb,
              n_sites, in_tiles, generation,
              round(6371000 * 2 * asin(sqrt(
                power(sin(radians($2 - lat) / 2), 2)
                + cos(radians(lat)) * cos(radians($2::float8))
                  * power(sin(radians($1 - lon) / 2), 2)
              ))) AS distance_m
         FROM fl_places
        WHERE lat BETWEEN $2::float8 - $3 AND $2::float8 + $3
          AND lon BETWEEN $1::float8 - $4 AND $1::float8 + $4
        ORDER BY 6371000 * 2 * asin(sqrt(
                   power(sin(radians($2 - lat) / 2), 2)
                   + cos(radians(lat)) * cos(radians($2::float8))
                     * power(sin(radians($1 - lon) / 2), 2)
                 ))
        LIMIT $5`,
      [lon, lat, dLat, dLon, n]
    );

    // The box is a square and the radius is a circle, so a place in a corner
    // is up to 1.41 radii away. Kept rather than filtered: the caller asked
    // for the nearest few, not for everything inside a circle, and throwing
    // away a real answer for being 2.8 km out when the search was 2 km would
    // send us to the next ring for nothing.
    if (rows.length) {
      return NextResponse.json({
        // The generation is the snapshot these rows came from, and the
        // phone needs it for the same reason the description bundles do: to
        // say what it is looking at when it reports something back.
        generation: rows[0].generation as number,
        searched_m: radius,
        places: rows.map(r => ({
          cluster_id: r.cluster_id as string,
          lon: r.lon as number,
          lat: r.lat as number,
          distance_m: Number(r.distance_m),
          family: r.family as string,
          class_sv: r.class_sv as string,
          // Empty strings on the way out become absent fields, so the app
          // has one case to handle -- missing -- rather than two.
          ...(r.name ? { name: r.name as string } : {}),
          ...(r.title ? { title: r.title as string } : {}),
          ...(r.blurb ? { blurb: r.blurb as string } : {}),
          n_sites: r.n_sites as number,
          // "This one is already a pin under your thumb." The app could work
          // it out from its own tiles, but only for the tiles it has: the
          // answer has to come from the same snapshot as the row.
          in_tiles: r.in_tiles as boolean,
        })),
      });
    }
  }

  // No generation here, because no row carried one. A separate query to
  // fl_config could supply it, and it would be a query run to decorate an
  // empty answer.
  return NextResponse.json({ places: [], searched_m: RINGS_M.at(-1) });
}

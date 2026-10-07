import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { comparePool } from '@/lib/compare-pool';
import {
  FEATURES,
  fitVotes,
  pickPair,
  predict,
  type Vote,
} from '@/lib/compare-model';
import { pool } from '@/lib/db';

/**
 * The next glance pair, and the vote on the one just shown.
 *
 * The probability in the response was computed before the vote was inserted,
 * so the number is what the model believed going in. The following pair is
 * chosen with the vote included. A tie trains as an equal pair. A skip is
 * stored and left out of the fit.
 */

type Row = {
  left_uuid: string;
  right_uuid: string;
  outcome: 'left' | 'right' | 'tie' | 'skip';
};

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

async function votes(): Promise<Vote[]> {
  const { rows } = await pool.query<Row>(
    `SELECT left_uuid, right_uuid, outcome
       FROM fl_comparisons
      ORDER BY id`
  );
  return rows.map(r => ({
    left: r.left_uuid,
    right: r.right_uuid,
    outcome: r.outcome,
  }));
}

function card(id: string) {
  const site = comparePool().byId.get(id);
  if (!site) {
    return null;
  }
  return {
    id: site.id,
    name: site.name,
    kind: site.kind,
    lat: site.lat,
    lon: site.lon,
  };
}

function stats(list: Vote[]) {
  const skips = list.filter(v => v.outcome === 'skip').length;
  return { votes: list.length - skips, skips };
}

const HAS_IMAGE = FEATURES.indexOf('has_image');

function nextPair(list: Vote[], hidden: Set<string>) {
  const { sites, byId, mean, std } = comparePool();
  const fit = fitVotes(byId, list, mean, std);
  // Only sites with a photograph are ever offered.
  const open = sites.filter(s => !hidden.has(s.id) && s.f[HAS_IMAGE] > 0);
  const pair = pickPair(open, list, fit);
  if (!pair) {
    return null;
  }
  return {
    left: card(pair[0].id),
    right: card(pair[1].id),
    ...stats(list),
  };
}

async function aside(): Promise<Set<string>> {
  try {
    const { rows } = await pool.query<{ place_uuid: string }>(
      `SELECT place_uuid FROM fl_compare_aside`
    );
    return new Set(rows.map(r => r.place_uuid));
  } catch (err) {
    if (missingTable(err)) {
      return new Set();
    }
    throw err;
  }
}

/** Out of the queue: not worth the trip, or set aside for lack of anything to judge. */
async function hiddenPlaces(): Promise<Set<string>> {
  const [dull, held] = await Promise.all([uninteresting(), aside()]);
  for (const id of held) {
    dull.add(id);
  }
  return dull;
}

async function uninteresting(): Promise<Set<string>> {
  try {
    const { rows } = await pool.query<{ place_uuid: string }>(
      `SELECT place_uuid FROM fl_uninteresting`
    );
    return new Set(rows.map(r => r.place_uuid));
  } catch (err) {
    if (missingTable(err)) {
      return new Set();
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  try {
    comparePool();
  } catch {
    return NextResponse.json(
      { error: 'compare pool is not built' },
      { status: 503 }
    );
  }
  try {
    const list = await votes();
    const body = nextPair(list, await hiddenPlaces());
    if (!body?.left || !body.right) {
      return NextResponse.json({ error: 'no pair left' }, { status: 404 });
    }
    return NextResponse.json(body);
  } catch (err) {
    if (missingTable(err)) {
      return NextResponse.json(
        { error: 'fl_comparisons is not created' },
        { status: 503 }
      );
    }
    throw err;
  }
}

const voteSchema = z.object({
  left: z.string().uuid(),
  right: z.string().uuid(),
  outcome: z.enum(['left', 'right', 'tie', 'skip']),
});

const asideSchema = z.object({
  action: z.literal('aside'),
  place: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const uid = await uidOf(request);
  if (!uid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'expected a JSON body' },
      { status: 400 }
    );
  }
  const holding = asideSchema.safeParse(raw);
  if (holding.success) {
    let loaded;
    try {
      loaded = comparePool();
    } catch {
      return NextResponse.json(
        { error: 'compare pool is not built' },
        { status: 503 }
      );
    }
    if (!loaded.byId.has(holding.data.place)) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    try {
      await pool.query(
        `INSERT INTO fl_compare_aside (place_uuid, created_by)
         VALUES ($1, $2)
         ON CONFLICT (place_uuid) DO NOTHING`,
        [holding.data.place, uid]
      );
    } catch (err) {
      if (missingTable(err)) {
        return NextResponse.json(
          { error: 'fl_compare_aside is not created' },
          { status: 503 }
        );
      }
      throw err;
    }
    let list: Vote[];
    try {
      list = await votes();
    } catch (err) {
      if (missingTable(err)) {
        return NextResponse.json(
          { error: 'fl_comparisons is not created' },
          { status: 503 }
        );
      }
      throw err;
    }
    return NextResponse.json({
      next: nextPair(list, await hiddenPlaces()),
    });
  }

  const parsed = voteSchema.safeParse(raw);
  if (!parsed.success || parsed.data.left === parsed.data.right) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  let loaded;
  try {
    loaded = comparePool();
  } catch {
    return NextResponse.json(
      { error: 'compare pool is not built' },
      { status: 503 }
    );
  }
  const left = loaded.byId.get(parsed.data.left);
  const right = loaded.byId.get(parsed.data.right);
  if (!left || !right) {
    return NextResponse.json({ error: 'unknown place' }, { status: 400 });
  }
  let list: Vote[];
  try {
    list = await votes();
  } catch (err) {
    if (missingTable(err)) {
      return NextResponse.json(
        { error: 'fl_comparisons is not created' },
        { status: 503 }
      );
    }
    throw err;
  }
  const fit = fitVotes(loaded.byId, list, loaded.mean, loaded.std);
  const belief = predict(left, right, list, fit);
  const lo = left.id < right.id ? left.id : right.id;
  const hi = left.id < right.id ? right.id : left.id;
  try {
    await pool.query(
      `INSERT INTO fl_comparisons
         (pair_lo, pair_hi, left_uuid, right_uuid, outcome, p_left, basis, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        lo,
        hi,
        left.id,
        right.id,
        parsed.data.outcome,
        belief.pLeft,
        belief.basis,
        uid,
      ]
    );
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === '23505') {
      return NextResponse.json({ error: 'already compared' }, { status: 409 });
    }
    if (missingTable(err)) {
      return NextResponse.json(
        { error: 'fl_comparisons is not created' },
        { status: 503 }
      );
    }
    throw err;
  }
  const stored: Vote = {
    left: left.id,
    right: right.id,
    outcome: parsed.data.outcome,
  };
  const following = nextPair([...list, stored], await hiddenPlaces());
  return NextResponse.json({
    pLeft: belief.pLeft,
    basis: belief.basis,
    leftName: left.name,
    rightName: right.name,
    outcome: parsed.data.outcome,
    next: following,
  });
}

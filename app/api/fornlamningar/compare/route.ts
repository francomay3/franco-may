import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { comparePool } from '@/lib/compare-pool';
import { fitVotes, pickPair, predict, type Vote } from '@/lib/compare-model';
import { pool } from '@/lib/db';

/**
 * The next glance pair, and the vote on the one just shown.
 *
 * The probability in the response was computed before the vote was inserted,
 * so the number is what the model believed going in. The following pair is
 * chosen with the vote included. A skip is stored and left out of the fit.
 */

type Row = {
  left_uuid: string;
  right_uuid: string;
  outcome: 'left' | 'right' | 'skip';
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

function nextPair(list: Vote[]) {
  const { sites, byId, mean, std } = comparePool();
  const fit = fitVotes(byId, list, mean, std);
  const pair = pickPair(sites, list, fit);
  if (!pair) {
    return null;
  }
  return {
    left: card(pair[0].id),
    right: card(pair[1].id),
    ...stats(list),
  };
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
    const body = nextPair(list);
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

const bodySchema = z.object({
  left: z.string().uuid(),
  right: z.string().uuid(),
  outcome: z.enum(['left', 'right', 'skip']),
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
  const parsed = bodySchema.safeParse(raw);
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
  const following = nextPair([...list, stored]);
  return NextResponse.json({
    pLeft: belief.pLeft,
    basis: belief.basis,
    leftName: left.name,
    rightName: right.name,
    outcome: parsed.data.outcome,
    next: following,
  });
}

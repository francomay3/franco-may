import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { addFlag, correctFlag, deleteFlag, listFlags } from '@/lib/fl-flags';
import { placeUuidOf } from '@/lib/lamning';

/**
 * Notes that a place needs a fix.
 *
 * GET lists them. Open notes are the default; `all=1` includes the ones
 * already marked corrected. POST adds one, marks one corrected, or
 * deletes one. The place page reads its own notes from the place route.
 */

type Desc = { title?: string };

const shards = new Map<string, Record<string, Desc>>();

function titleOf(uuid: string): string | null {
  const shard = uuid.slice(0, 2).toLowerCase();
  let bag = shards.get(shard);
  if (!bag) {
    try {
      bag = JSON.parse(
        readFileSync(
          join(process.cwd(), 'public', 'descriptions', `${shard}.json`),
          'utf8'
        )
      ) as Record<string, Desc>;
    } catch {
      bag = {};
    }
    shards.set(shard, bag);
  }
  return bag[uuid]?.title ?? null;
}

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    place: z.string().min(1),
    note: z.string().trim().min(1).max(2000),
  }),
  z.object({
    action: z.literal('correct'),
    id: z.string().regex(/^\d+$/),
  }),
  z.object({
    action: z.literal('delete'),
    id: z.string().regex(/^\d+$/),
  }),
]);

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const openOnly = request.nextUrl.searchParams.get('all') !== '1';
  const flags = await listFlags(openOnly);
  return NextResponse.json({
    flags: flags.map(flag => ({
      ...flag,
      title: titleOf(flag.place_uuid),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
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
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const uid = await uidOf(request);
  if (!uid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (parsed.data.action === 'add') {
    const uuid = placeUuidOf(parsed.data.place);
    if (!uuid) {
      return NextResponse.json({ error: 'unknown place' }, { status: 400 });
    }
    const flag = await addFlag(uuid, parsed.data.note, uid);
    return NextResponse.json({ ok: true, flag });
  }
  if (parsed.data.action === 'correct') {
    const flag = await correctFlag(parsed.data.id, uid);
    if (!flag) {
      return NextResponse.json({ error: 'unknown flag' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, flag });
  }
  const removed = await deleteFlag(parsed.data.id);
  if (!removed) {
    return NextResponse.json({ error: 'unknown flag' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

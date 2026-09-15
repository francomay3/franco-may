import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

/**
 * DELETE everything an author has published. The server half of "Glöm mig".
 *
 * WHY THIS EXISTS AT ALL, given that the log is append-only. Append-only is a
 * rule about how the app treats facts, not a promise to a person that their
 * contributions are permanent whether they like it or not. Deleting the local
 * copy while the published rows stay is the worst of the three outcomes: it
 * looks like erasure and is not one, and afterwards nobody can even find the
 * rows again -- the device id was the only handle on them, and it has just
 * been thrown away. So this is called BEFORE the phone discards its id, and
 * the phone does not wipe itself unless this succeeded.
 *
 * AUTHORISATION IS THE ID ITSELF, and that is the same trust model the writes
 * already use: a device id is 122 bits of randomness, it is a bearer secret,
 * and whoever holds it can already publish as this author. Being able to
 * delete as them is more destructive, but it is not a wider door -- and the
 * header, never a query string, for the reason the POST route explains.
 *
 * THIS DEVICE ONLY, even for a signed-in person with two phones. The link
 * table could be followed to find the other device and erase it too, and for
 * a strict reading of erasure it probably should be. It deliberately is not
 * yet: one device's secret would then destroy data written on another, and
 * the dialog that triggers this is standing on one phone and can honestly
 * promise only what that phone did. The other phone has the same button.
 *
 * The link row goes with the events. Leaving it would keep a mapping from a
 * discarded device id to a live account, which is a record of the person we
 * were asked to forget.
 */

const uuid = z.string().uuid();

export async function DELETE(request: NextRequest) {
  const id = request.headers.get('x-author-id');
  const author = id && uuid.safeParse(id).success ? id : null;
  if (!author) {
    return NextResponse.json(
      { error: 'missing or malformed X-Author-Id' },
      { status: 401 }
    );
  }

  // One statement each, not a transaction: they are independent deletions and
  // a half-done erasure is better than a refused one -- the caller can retry,
  // and a retry deletes whatever is left.
  const events = await pool.query('DELETE FROM fl_events WHERE author = $1', [
    author,
  ]);
  await pool.query('DELETE FROM fl_account_devices WHERE device = $1', [
    author,
  ]);

  // The count is reported because the phone shows it: "nothing to delete" and
  // "deleted 14 things" are different enough to be worth saying, and a person
  // who just asked to be erased deserves to be told what happened rather than
  // a spinner that stops.
  return NextResponse.json({ ok: true, deleted: events.rowCount ?? 0 });
}

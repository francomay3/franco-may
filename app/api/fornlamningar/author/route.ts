import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tx } from '@/lib/db';

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
 *
 * AND A DELETION IS AN EVENT, which is the part this route got wrong for a
 * while. `DELETE FROM fl_events` removes the rows from the server and tells
 * NOBODY: the log is append-only for its readers, so every phone that had
 * already synced still holds the erased author's ratings in its own SQLite,
 * with its cursor far past them -- and those ratings went on counting in
 * everybody else's average for ever. That is worse than having no button,
 * because it looks like erasure and is not one.
 *
 * So the erasure is published first, as `author_erased`, and the physical
 * delete follows. `applyRemote` in the app deletes every local row by that
 * author when it sees one. scripts/fornlamningar-events.sql said this all
 * along -- a retraction is an event -- and this endpoint was the one place
 * that skipped its own rule.
 *
 * THE TOMBSTONE KEEPS THE AUTHOR ID, and that is deliberate rather than an
 * oversight in an erasure route. It is the only field it has, and it is what
 * lets the read path derive the same pseudonym the other phones filed those
 * rows under -- without it the event names nobody and deletes nothing. The
 * id itself is a random 122 bits that the phone discards in the next step,
 * so what survives is a handle to no device, no account and no rows.
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

  // ONE TRANSACTION, which is a change from the three independent statements
  // this used to run. The reasoning then was that a half-done erasure beats a
  // refused one. That holds while the steps are only deletions; it stops
  // holding the moment one of them is a PUBLICATION. Deleting the rows
  // without publishing the tombstone leaves the other phones holding data
  // nobody can ask about again, and publishing without deleting leaves the
  // server serving rows it has announced as withdrawn. Either half alone is
  // worse than a retry.
  // AND THE DELETE COMES FIRST, WHICH IS ALSO THE AUTHORISATION.
  //
  // This route does NOT require the caller to be signed in, unlike the POST
  // of events -- an unlinked device has published nothing under the new rule,
  // but it still has a local database, and a "forget me" it cannot complete
  // is worse than the bug this route was fixing: the app does not wipe itself
  // unless the server succeeded, so a 403 here would mean an anonymous person
  // can never be forgotten at all.
  //
  // That leaves one hole -- anybody could mint a uuid and make us write a
  // tombstone for an author with no rows. Closed by ORDER rather than by a
  // permission: delete first, and publish only if something was actually
  // deleted. An author with nothing to erase produces no event, so there is
  // nothing to spam the log with, and the tombstone never announces a
  // withdrawal that withdraws nothing.
  const deleted = await tx(async c => {
    // `place_uuid = '*'` on the tombstone below because there is no place. No
    // constraint requires it; an explicit marker is easier to read in a table
    // dump than an empty string, and impossible to confuse with a uuid.
    const gone = await c.query(
      "DELETE FROM fl_events WHERE author = $1 AND kind <> 'author_erased'",
      [author]
    );
    const count = gone.rowCount ?? 0;

    if (count > 0) {
      // The counter's row lock and the number it hands out, exactly as the
      // POST of events does it. See scripts/fornlamningar-events.sql for why
      // this is not a bigserial.
      const { rows } = await c.query<{ v: string }>(
        'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v',
        []
      );
      await c.query(
        `INSERT INTO fl_events
           (seq, event_id, kind, place_uuid, author, payload)
         VALUES ($1, $2, 'author_erased', '*', $3, '{}'::jsonb)`,
        [Number(rows[0].v), crypto.randomUUID(), author]
      );
    }

    await c.query('DELETE FROM fl_account_devices WHERE device = $1', [author]);
    return count;
  });

  // The count is reported because the phone shows it: "nothing to delete" and
  // "deleted 14 things" are different enough to be worth saying, and a person
  // who just asked to be erased deserves to be told what happened rather than
  // a spinner that stops.
  return NextResponse.json({ ok: true, deleted });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, uidOf } from '@/lib/admin';
import { pool, tx } from '@/lib/db';
import { cleanPayload, publicAuthor } from '@/lib/fl-authors';

/**
 * The moderation surface. Read the recent comments, withdraw a bad one.
 *
 * POST-MODERATION, AND THAT IS A LEGAL READING AS MUCH AS A PRODUCT ONE. EU
 * hosting law does not require review before publication: the safe harbour
 * (DSA art. 6, previously the e-Commerce Directive art. 14) turns on acting
 * expeditiously once you have actual knowledge, and art. 7 exists so that
 * looking voluntarily does not cost you it. What is required is being
 * reachable -- a notice-and-action route -- and being able to take something
 * down. This is the taking-down half.
 *
 * So the normal state of this page is DOING NOTHING. It is a feed of what was
 * published, newest first, and the only action is `hide`. Nothing waits for
 * approval, nothing is delayed, and a comment is live the moment its author
 * writes it.
 *
 * WHY A REMOVAL IS AN EVENT AND NOT A COLUMN. The log is append-only and each
 * phone reads it from a cursor. A comment that arrived at seq 500 has already
 * been replicated by every device past 500, so setting `hidden = true` on
 * that row reaches nobody: the phones holding it will never ask for it again.
 * `comment_removed` gets a fresh seq, so it travels the same path the comment
 * did, to the same devices.
 *
 * 404 AND NOT 403 for anyone who is not an admin. Telling a stranger that an
 * endpoint exists but they may not use it is free reconnaissance, and this is
 * the one route in the service whose existence is worth hiding. The bootstrap
 * case is the single exception below, and it reveals only the caller's own id
 * to the caller.
 */

const actionSchema = z.object({
  // `keep` is not a no-op: it marks the reports handled without touching the
  // comment. Without it, the only way to get a wrongly-reported comment off
  // the top of the page would be to delete it, which is the opposite
  // decision. A moderation queue where "this is fine" is unrepresentable
  // pushes you towards removing things.
  action: z.enum(['hide', 'keep', 'approve', 'reject']),
  /** The comment's own event_id, which the feed below hands out. */
  event_id: z.string().uuid(),
  /** Why, for the record. Not shown to anybody yet. */
  note: z.string().max(500).optional(),
});

/** How many recent comments to show. Small on purpose: this is a feed to skim. */
const WINDOW = 100;

/**
 * The author a moderation event is filed under, and it is NOT the commenter.
 *
 * This matters more than it looks. The events GET drops the caller's OWN
 * events -- `author <> $2` -- so that a device does not re-download
 * everything it wrote. File the removal under the commenter and that person
 * is the one device on earth that never receives it: their comment would go
 * on showing on their own phone, for ever, while it was gone everywhere else.
 *
 * The nil uuid because it is a shape every reader already accepts and one no
 * device can ever be issued. It also means the "forget me" route, which
 * deletes `WHERE author = $1`, cannot take moderation decisions with it.
 */
const MODERATOR = '00000000-0000-0000-0000-000000000000';

export async function GET(request: NextRequest) {
  // The bootstrap: a valid token that is not on the list gets told its own
  // uid, because the list cannot be filled in before its first sign-in and
  // knowing your own id grants nothing. An INVALID token gets the 404 that
  // everybody else gets.
  if (!(await isAdmin(request))) {
    const uid = await uidOf(request);
    if (uid) {
      return NextResponse.json(
        {
          error: 'not an admin',
          reason: 'not_listed',
          uid,
          hint: 'add this uid to FL_ADMIN_UIDS',
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  try {
    // Comments, newest first, with the removals that already apply to them.
    //
    // LEFT JOIN rather than a second query, so a comment already withdrawn
    // still SHOWS -- greyed out, in the client -- instead of vanishing. A
    // moderation log where the decisions disappear is one where you cannot
    // tell "nobody has looked at this" from "somebody looked and allowed it".
    const { rows } = await pool.query(
      `SELECT c.seq, c.event_id, c.place_uuid, c.author, c.payload,
              c.server_ts,
              r.server_ts AS removed_at,
              rep.n AS reports,
              rep.reasons,
              rep.notes
         FROM fl_events c
         LEFT JOIN fl_events r
                ON r.kind = 'comment_removed'
               AND r.payload->>'target_event_id' = c.event_id::text
         LEFT JOIN (
           SELECT target,
                  count(*) AS n,
                  string_agg(DISTINCT reason, ', ') AS reasons,
                  string_agg(note, ' | ') FILTER (WHERE note IS NOT NULL)
                    AS notes
             FROM fl_reports
            WHERE kind = 'comment' AND handled_at IS NULL
            GROUP BY target
         ) rep ON rep.target = c.event_id
        WHERE c.kind = 'comment'
        -- REPORTED FIRST, then newest. The page is a feed to skim and the
        -- reports are the only thing on it that somebody is waiting for an
        -- answer to; leaving them in date order would mean a report from
        -- last week sits below a hundred harmless comments from today.
        ORDER BY (rep.n IS NOT NULL) DESC, c.seq DESC
        LIMIT $1`,
      [WINDOW]
    );

    // The pseudonym, NOT the raw author id, even here. That value is a write
    // credential rather than a name, so who may see one does not depend on
    // how trusted the viewer is. The pseudonym is enough for everything this
    // page needs: recognising that two comments are the same person.
    const out = [];
    for (const r of rows) {
      const author = await publicAuthor(r.author);
      out.push({
        seq: Number(r.seq),
        event_id: r.event_id,
        place_uuid: r.place_uuid,
        author,
        body: (cleanPayload(r.payload).body as string) ?? '',
        created_at: new Date(r.server_ts).toISOString(),
        removed_at: r.removed_at ? new Date(r.removed_at).toISOString() : null,
      });
    }

    return NextResponse.json({
      comments: out,
      photos: {
        accepted: true,
        pending: (
          await pool.query(
            `SELECT event_id, place_uuid, payload, created_at
               FROM fl_photo_queue
              ORDER BY created_at ASC
              LIMIT $1`,
            [WINDOW]
          )
        ).rows.map(r => ({
          event_id: r.event_id,
          place_uuid: r.place_uuid,
          width: r.payload?.width ?? null,
          height: r.payload?.height ?? null,
          created_at: new Date(r.created_at).toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error('moderation read failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
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
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'bad request' },
      { status: 400 }
    );
  }
  const { action, event_id, note } = parsed.data;

  if (action === 'approve' || action === 'reject') {
    try {
      if (action === 'reject') {
        const { rowCount } = await pool.query(
          'DELETE FROM fl_photo_queue WHERE event_id = $1',
          [event_id]
        );
        return NextResponse.json({ ok: true, removed: rowCount ?? 0 });
      }
      const result = await tx(async c => {
        const { rows: queued } = await c.query(
          `SELECT place_uuid, author, payload, client_ts
             FROM fl_photo_queue WHERE event_id = $1`,
          [event_id]
        );
        if (!queued.length) {
          const { rows: published } = await c.query(
            `SELECT 1 FROM fl_events WHERE event_id = $1 AND kind = 'photo'`,
            [event_id]
          );
          return { status: published.length ? 200 : 404, already: true };
        }
        const row = queued[0];
        const { rows: seq } = await c.query<{ v: string }>(
          'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v'
        );
        await c.query(
          `INSERT INTO fl_events
             (seq, event_id, kind, place_uuid, author, payload, client_ts)
           VALUES ($1, $2, 'photo', $3, $4, $5, $6)
           ON CONFLICT (event_id) DO NOTHING`,
          [
            Number(seq[0].v),
            event_id,
            row.place_uuid,
            row.author,
            JSON.stringify(row.payload),
            row.client_ts,
          ]
        );
        await c.query('DELETE FROM fl_photo_queue WHERE event_id = $1', [
          event_id,
        ]);
        return { status: 200, already: false };
      });
      if (result.status === 404) {
        return NextResponse.json({ error: 'no such photo' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, already: result.already });
    } catch (e) {
      console.error('photo moderation failed', e);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  }

  if (action === 'keep') {
    try {
      const { rowCount } = await pool.query(
        `UPDATE fl_reports SET handled_at = now()
          WHERE kind = 'comment' AND target = $1 AND handled_at IS NULL`,
        [event_id]
      );
      return NextResponse.json({ ok: true, handled: rowCount ?? 0 });
    } catch (e) {
      console.error('moderation keep failed', e);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  }

  try {
    const result = await tx(async c => {
      // The comment has to exist. A removal that names nothing would be a
      // row every phone applies to no comment, and it would sit in the log
      // for ever looking like a decision somebody made.
      //
      // Unlike comment_delete, the phone does NOT check the author here:
      // comment_delete is the author withdrawing their own words, so the
      // phone verifies that locally and a compromised server cannot make one
      // person delete another's. A removal is the opposite case by
      // definition -- somebody else's words -- and it is safe only because
      // comment_removed is in SERVER_KINDS and no client can post one.
      const { rows: target } = await c.query(
        "SELECT 1 FROM fl_events WHERE event_id = $1 AND kind = 'comment'",
        [event_id]
      );
      if (!target.length) {
        return { status: 404 as const };
      }

      // Idempotent: hiding twice is one removal. A double tap on a phone with
      // a slow connection is the ordinary way this happens, and a second
      // event would be a second row saying the same thing for ever.
      const { rows: already } = await c.query(
        `SELECT 1 FROM fl_events
          WHERE kind = 'comment_removed'
            AND payload->>'target_event_id' = $1`,
        [event_id]
      );
      if (already.length) {
        return { status: 200 as const, already: true };
      }

      // The counter's row lock and the number it hands out, exactly as the
      // events POST does it. See scripts/fornlamningar-events.sql for why
      // this is not a bigserial.
      const { rows: seq } = await c.query<{ v: string }>(
        'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v'
      );
      await c.query(
        `INSERT INTO fl_events
           (seq, event_id, kind, place_uuid, author, payload)
         SELECT $1, $2, 'comment_removed', place_uuid, $3, $4::jsonb
           FROM fl_events WHERE event_id = $5 AND kind = 'comment'`,
        [
          Number(seq[0].v),
          crypto.randomUUID(),
          MODERATOR,
          JSON.stringify({ target_event_id: event_id, note: note ?? null }),
          event_id,
        ]
      );
      // The reports about it are settled by the same act. Left open, they
      // would keep a comment that has already been dealt with pinned to the
      // top of the page -- and "still waiting" is the only thing this
      // column is for.
      await c.query(
        `UPDATE fl_reports SET handled_at = now()
          WHERE kind = 'comment' AND target = $1 AND handled_at IS NULL`,
        [event_id]
      );
      return { status: 200 as const, already: false };
    });

    if (result.status === 404) {
      return NextResponse.json({ error: 'no such comment' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, already: result.already });
  } catch (e) {
    console.error('moderation write failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

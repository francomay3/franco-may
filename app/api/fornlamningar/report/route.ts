import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

/**
 * Tell us that something published here should not be.
 *
 * THE OBLIGATORY HALF OF POST-MODERATION. Comments publish immediately,
 * which EU hosting law allows: the safe harbour (DSA art. 6) turns on acting
 * expeditiously once you have actual knowledge. What art. 16 does not make
 * optional is a way to GIVE you that knowledge, and it has no
 * micro-enterprise exemption. "We take it down when told" needs a channel to
 * be told through, and this is it.
 *
 * NO ACCOUNT REQUIRED, unlike commenting, and the asymmetry is the point.
 * Requiring somebody to sign up before they can report illegal content would
 * defeat the duty. A comment is a claim addressed to strangers, so it needs
 * an identity that can carry consequence; a report is addressed to us and
 * costs us a read.
 *
 * AND IT DOES NOT AUTO-HIDE. Three reports taking a comment down is one line
 * of SQL and a bad idea while reports are anonymous: a device id is minted,
 * not held, so "three people" is one person three times. When reporting
 * eventually requires an account -- or when there is enough traffic for
 * brigading to be the smaller risk than delay -- that changes. Today a
 * report is a summons to look, not a verdict.
 *
 * NOTHING IS PUBLISHED BY THIS. The report never enters fl_events, so it
 * reaches no other phone: distributing "this was reported" would hand every
 * device a way to smear a contribution with no decision behind it.
 */

const uuid = z.string().uuid();

/**
 * Why, from a fixed list.
 *
 * A closed set rather than free text, because a report has to be countable
 * and sortable by somebody with two minutes, and because the categories are
 * what separate "I disagree with this" from the ones that carry a legal
 * duty. `illegal` and `abuse` are the ones that have to be looked at today;
 * `wrong` and `spam` can wait for a quiet evening.
 */
const REASONS = ['illegal', 'abuse', 'spam', 'wrong', 'other'] as const;

const bodySchema = z.object({
  kind: z.literal('comment'),
  target: uuid,
  place_uuid: z.string().min(1).max(64).optional(),
  reason: z.enum(REASONS),
  note: z.string().max(1000).optional(),
});

/** Reports per device per day. Generous: a real reporter reports a handful. */
const DAILY_LIMIT = 30;

export async function POST(request: NextRequest) {
  // The device id, as everywhere else: a header and never a query string,
  // because a URL lands in access logs.
  const id = request.headers.get('x-author-id');
  const reporter = id && uuid.safeParse(id).success ? id : null;
  if (!reporter) {
    return NextResponse.json(
      { error: 'missing or malformed X-Author-Id' },
      { status: 401 }
    );
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'bad request' },
      { status: 400 }
    );
  }
  const { kind, target, place_uuid, reason, note } = parsed.data;

  try {
    const { rows: recent } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM fl_reports
        WHERE reporter = $1 AND created_at > now() - interval '1 day'`,
      [reporter]
    );
    if (Number(recent[0]?.n ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json({ error: 'rate limit' }, { status: 429 });
    }

    // The target has to exist and be the kind claimed. A report about
    // nothing is a row somebody has to read before discovering there was
    // never anything to look at.
    const { rows: exists } = await pool.query(
      "SELECT 1 FROM fl_events WHERE event_id = $1 AND kind = 'comment'",
      [target]
    );
    if (!exists.length) {
      return NextResponse.json({ error: 'no such comment' }, { status: 404 });
    }

    // ON CONFLICT so a second tap is the same report rather than an error:
    // the person pressed a button and the outcome they wanted is already
    // true. The note is updated, because a second report from the same
    // device is usually somebody adding what they forgot to say.
    await pool.query(
      `INSERT INTO fl_reports (kind, target, place_uuid, reporter, reason, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (reporter, kind, target) DO UPDATE
         SET reason = excluded.reason,
             note = COALESCE(excluded.note, fl_reports.note)`,
      [kind, target, place_uuid ?? null, reporter, reason, note ?? null]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('report failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

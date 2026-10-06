import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';

/**
 * The numbers on the admin home.
 *
 * Comments and photos are the moderation queue, the same rows the feed
 * shows: a comment still waiting for a look, or reported again, and a
 * photo still sitting in the queue. Matches are comparison votes, skips
 * aside. Flags are the ones not yet marked corrected.
 */

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

async function count(sql: string): Promise<number> {
  try {
    const { rows } = await pool.query<{ n: number }>(sql);
    return Number(rows[0]?.n ?? 0);
  } catch (err) {
    if (missingTable(err)) {
      return 0;
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  try {
    const [comments, photos, matches, flags] = await Promise.all([
      count(
        `SELECT count(*)::int AS n
           FROM fl_events c
           LEFT JOIN fl_events r
                  ON r.kind = 'comment_removed'
                 AND r.payload->>'target_event_id' = c.event_id::text
           LEFT JOIN (
             SELECT target, count(*) AS n
               FROM fl_reports
              WHERE kind = 'comment' AND handled_at IS NULL
              GROUP BY target
           ) rep ON rep.target = c.event_id
          WHERE c.kind = 'comment'
            AND (
              rep.n IS NOT NULL
              OR (
                r.server_ts IS NULL
                AND NOT EXISTS (
                  SELECT 1 FROM fl_comment_accept a
                   WHERE a.event_id = c.event_id
                )
              )
            )`
      ),
      count(
        `SELECT count(*)::int AS n
           FROM fl_photo_queue q
          WHERE NOT EXISTS (
            SELECT 1 FROM fl_events r
             WHERE r.kind = 'photo_removed'
               AND r.payload->>'target_event_id' = q.event_id::text
          )`
      ),
      count(
        `SELECT count(*)::int AS n
           FROM fl_comparisons
          WHERE outcome <> 'skip'`
      ),
      count(
        `SELECT count(*)::int AS n
           FROM fl_place_flags
          WHERE corrected_at IS NULL`
      ),
    ]);

    return NextResponse.json({ comments, photos, matches, flags });
  } catch (e) {
    console.error('admin summary failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

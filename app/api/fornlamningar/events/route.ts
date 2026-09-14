import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool, tx } from '@/lib/db';

/**
 * The sync endpoint for the fornlämningar app.
 *
 * POST appends events; GET reads the log from a cursor. That is the whole
 * API, and it is deliberately the whole API: the phone holds the state and
 * this is a durable, ordered mailbox between phones.
 *
 * WHAT ANONYMOUS DEVICES MAY WRITE. A device id is 122 bits of
 * cryptographic randomness, so it cannot be guessed -- it is a bearer secret
 * and travels in a header, never in a URL where it would land in access
 * logs. So the question is not "can we trust this id" but "what should an
 * unaccountable author be able to publish". The line drawn here is *does
 * anyone else read it*: a rating is one number that gets averaged, while a
 * comment or a photo appears in front of other people and can be abusive,
 * defamatory or illegal. Those need an account that can be banned, not just
 * an id that can be minted again in a second.
 */

const ANONYMOUS_KINDS = new Set(['rating', 'visit', 'favourite']);
const ACCOUNT_KINDS = new Set([
  'comment',
  'comment_delete',
  'photo',
  'photo_delete',
]);

/** Events per author per hour, and per IP per hour. */
const AUTHOR_LIMIT = 200;
const IP_LIMIT = 600;

const uuid = z.string().uuid();

const eventSchema = z.object({
  event_id: uuid,
  kind: z.string().min(1).max(32),
  uuid: z.string().min(1).max(64),
  client_ts: z.string().max(40).optional(),
  payload: z.record(z.string(), z.unknown()),
});

const bodySchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

/**
 * Shape checks per kind, applied before anything is written.
 *
 * The phone checks these too. Doing it again here is not redundancy for its
 * own sake: a value that fails the app's own SQLite CHECK constraint would
 * abort the transaction that applies a whole batch, so one bad row stored
 * today breaks every reader's sync tomorrow.
 */
const payloadSchemas: Record<string, z.ZodTypeAny> = {
  rating: z.object({ stars: z.number().int().min(1).max(5) }).loose(),
  visit: z.object({}).loose(),
  favourite: z.object({ on: z.boolean() }).loose(),
  comment: z.object({ body: z.string().trim().min(1).max(2000) }).loose(),
  comment_delete: z.object({ target_event_id: uuid }).loose(),
  photo: z
    .object({
      url: z.string().url().max(500),
      width: z.number().int().positive().max(20000).optional(),
      height: z.number().int().positive().max(20000).optional(),
      credit: z.string().max(200).optional(),
    })
    .loose(),
  photo_delete: z.object({ target_event_id: uuid }).loose(),
};

function authorFrom(request: NextRequest): string | null {
  const id = request.headers.get('x-author-id');
  return id && uuid.safeParse(id).success ? id : null;
}

/**
 * A salted hash of the caller's address.
 *
 * Enough to count requests, useless as a record of where somebody was. The
 * salt has to be set: without it the hash of an IPv4 address is reversible by
 * trying all four billion of them.
 */
function ipHash(request: NextRequest): string | null {
  const salt = process.env.FL_IP_SALT;
  if (!salt) {return null;}
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';
  if (!ip) {return null;}
  return createHash('sha256')
    .update(salt)
    .update(ip)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Is this author allowed to write at all?
 *
 * Counted in Postgres and not in a Map, because every serverless instance has
 * its own memory: an in-process counter limits one lambda and lets the next
 * cold start through, which for a rate limit means it does not work.
 */
async function overLimit(author: string, ip: string | null): Promise<boolean> {
  const { rows } = await pool.query<{ by_author: string; by_ip: string }>(
    `SELECT
       count(*) FILTER (WHERE author = $1) AS by_author,
       count(*) FILTER (WHERE $2::text IS NOT NULL AND ip_hash = $2) AS by_ip
     FROM fl_events
     WHERE server_ts > now() - interval '1 hour'`,
    [author, ip]
  );
  const r = rows[0];
  return Number(r.by_author) >= AUTHOR_LIMIT || Number(r.by_ip) >= IP_LIMIT;
}

export async function POST(request: NextRequest) {
  const author = authorFrom(request);
  if (!author) {
    return NextResponse.json(
      { error: 'missing or malformed X-Author-Id' },
      { status: 401 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }

  for (const e of body.events) {
    if (ACCOUNT_KINDS.has(e.kind)) {
      // Sign-in does not exist yet, so this is the honest answer rather than
      // accepting content nobody can be held to. The app does not send these
      // kinds; a client that does gets told why.
      return NextResponse.json(
        {
          error: `kind "${e.kind}" requires a signed-in account`,
          kind: e.kind,
        },
        { status: 403 }
      );
    }
    if (!ANONYMOUS_KINDS.has(e.kind)) {
      return NextResponse.json(
        { error: `unknown kind "${e.kind}"` },
        { status: 400 }
      );
    }
    const schema = payloadSchemas[e.kind];
    if (!schema || !schema.safeParse(e.payload).success) {
      return NextResponse.json(
        {
          error: `payload does not match kind "${e.kind}"`,
          event_id: e.event_id,
        },
        { status: 400 }
      );
    }
  }

  const ip = ipHash(request);
  if (await overLimit(author, ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 });
  }

  try {
    const seq = await tx(async c => {
      // Take the counter's row lock, then insert with the numbers it hands
      // out, all in this transaction. See scripts/fornlamningar-events.sql
      // for why this is not a bigserial.
      const n = body.events.length;
      const { rows } = await c.query<{ v: string }>(
        'UPDATE fl_event_seq SET v = v + $1 WHERE id = 1 RETURNING v',
        [n]
      );
      const last = Number(rows[0].v);
      const first = last - n + 1;
      for (let i = 0; i < n; i++) {
        const e = body.events[i];
        await c.query(
          `INSERT INTO fl_events
             (seq, event_id, kind, place_uuid, author, payload, client_ts, ip_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (event_id) DO NOTHING`,
          [
            first + i,
            e.event_id,
            e.kind,
            e.uuid,
            author,
            JSON.stringify(e.payload),
            e.client_ts ?? null,
            ip,
          ]
        );
      }
      return last;
    });
    // 'accepted' is the count the client queued, not the count inserted: a
    // replay of an event we already have is a success from the phone's point
    // of view, and it must clear its outbox either way.
    return NextResponse.json({ ok: true, seq, accepted: body.events.length });
  } catch (e) {
    console.error('fl_events insert failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

const querySchema = z.object({
  since: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

export async function GET(request: NextRequest) {
  const author = authorFrom(request);
  if (!author) {
    return NextResponse.json(
      { error: 'missing or malformed X-Author-Id' },
      { status: 401 }
    );
  }
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad query' }, { status: 400 });
  }
  const { since, limit } = parsed.data;

  try {
    // The caller's own events are dropped HERE and not on the phone, so a
    // device does not re-download everything it wrote itself, on every
    // device the account owns, forever.
    const { rows } = await pool.query(
      `SELECT seq, event_id, kind, place_uuid, author, payload, server_ts
       FROM fl_events
       WHERE seq > $1 AND author <> $2
       ORDER BY seq
       LIMIT $3`,
      [since, author, limit]
    );
    // The cursor advances to the newest row the caller has actually seen, or
    // -- when the window held only its own events -- to the newest row that
    // exists, so the same empty window is not asked for again.
    const { rows: head } = await pool.query<{ v: string }>(
      'SELECT v FROM fl_event_seq WHERE id = 1'
    );
    const seq = rows.length
      ? Number(rows[rows.length - 1].seq)
      : Number(head[0]?.v ?? since);
    return NextResponse.json({
      seq,
      events: rows.map(r => ({
        seq: Number(r.seq),
        event_id: r.event_id,
        kind: r.kind,
        uuid: r.place_uuid,
        author: r.author,
        server_ts: new Date(r.server_ts).toISOString(),
        payload: r.payload,
      })),
    });
  } catch (e) {
    console.error('fl_events read failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool, tx } from '@/lib/db';
import { cleanPayload, publicAuthors } from '@/lib/fl-authors';

/**
 * The sync endpoint for the fornlämningar app.
 *
 * POST appends events; GET reads the log from a cursor. That is the whole
 * API, and it is deliberately the whole API: the phone holds the state and
 * this is a durable, ordered mailbox between phones.
 *
 * WRITING NEEDS AN ACCOUNT; READING DOES NOT. The POST requires that the
 * calling device be linked to one (see /link); the GET is open, because the
 * map has to show everybody's averages to everybody.
 *
 * THAT IS A REVERSAL, and the reasoning is worth keeping. A device id is 122
 * bits of cryptographic randomness, so it cannot be guessed -- a bearer
 * secret, travelling in a header and never in a URL where it would land in
 * access logs. The old line was drawn at *does anyone else read it*: a
 * rating is one number that gets averaged, a comment appears in front of
 * people, so comments needed an account and ratings did not.
 *
 * What that missed is that AN ANONYMOUS ID IS MINTED, NOT HELD. Anyone can
 * generate a fresh uuid as often as they like, so a per-author rate limit is
 * decorative, and "two independent visitors agree" -- the rule the app wants
 * before it tells anybody a place has no sign -- is one person with a loop.
 * Neither of those was ever a statement about content; both are statements
 * about identity, and an anonymous id cannot make them.
 *
 * A Google account is not unforgeable either, but it costs something to mint
 * at scale and it can be banned, which is the whole difference.
 *
 * NOTHING BECOMES UNUSABLE WITHOUT SIGNING IN. Rating, favouriting, visiting
 * and answering are all recorded on the phone and shown back to their author
 * with no account at all; the queue simply holds them until there is one. The
 * device id is still the author -- signing in adopts it rather than replacing
 * it -- so a contribution made before signing in publishes afterwards under
 * the same author, and nothing has to be migrated.
 */

/** Every kind a client may post. All of them now require an account. */
const KINDS = new Set([
  'rating',
  'visit',
  'favourite',
  'sign',
  'presence',
  'comment',
  'comment_delete',
  'photo',
  'photo_delete',
]);

/**
 * Kinds that are still refused even WITH an account, for a second reason.
 *
 * This held comments as well until moderation existed. It does now, and
 * comments are POST-moderated: they publish immediately and a bad one is
 * withdrawn with `comment_removed`. That is not a shortcut -- EU hosting law
 * does not require review before publication. What it requires is being
 * reachable and acting on a notice, and the safe harbour in the DSA (art. 6)
 * turns on acting expeditiously once you know, not on knowing first. So the
 * cost of pre-moderating text was a comment that takes hours to appear
 * because nobody was looking, which is a comment nobody writes twice.
 *
 * PHOTOS STAY, and the asymmetry is the whole point rather than an
 * inconsistency. An image carries an obligation text does not -- child sexual
 * abuse material is not a "remove it when told" regime -- so for photos the
 * window between posting and review is exactly what must not exist. They get
 * a real queue when they get built, and there is no storage for them yet
 * either.
 *
 * The `reason` in the response still says which refusal a client is looking
 * at, so the app can tell "sign in" from "not built yet".
 */
const UNMODERATED_KINDS = new Set(['photo', 'photo_delete']);

/**
 * Kinds only the SERVER writes, and no client may post.
 *
 * `author_erased` is the retraction the author route emits: a row saying
 * "everything by this author is withdrawn", which is how an erasure reaches
 * the phones that already replicated the rows. It is in neither set above,
 * so the POST path rejects it with 400 "unknown kind" like any other kind a
 * client has no business sending -- listed here so that is a decision rather
 * than an omission. The GET serves it like anything else, which is the point.
 *
 * `comment_removed` is the same shape for one comment: the moderation route
 * emits it, every phone hides that comment when it syncs, and no client may
 * forge one. A MODERATION DECISION HAS TO BE AN EVENT and cannot be a column
 * on the row it is about -- the log is append-only and each phone reads it
 * from a cursor, so a comment that arrived at seq 500 has already been
 * replicated by everyone past 500, and flipping a flag on it reaches nobody.
 * That is also why `comment_delete` (the author withdrawing their own) works
 * the way it does.
 */
const SERVER_KINDS = new Set(['author_erased', 'comment_removed']);

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
  // `visited` is the phone saying the author had been to the place. It is
  // optional because ratings written before visits existed genuinely do not
  // know, and unknown is not the same as false.
  //
  // Exactly ONE of `stars` and `not_found`, enforced rather than trusted. A
  // rating is one answer in one of two shapes: a score from one to five, or
  // "I could not find it". They are not the same statement -- one star means
  // the place is not worth recommending, the flag means there was nothing to
  // judge -- so a row carrying both is a row no reader can interpret, and one
  // carrying neither is an answer with no content. The phone's CHECK
  // constraint says the same thing; see the note above about why both say it.
  //
  // `stars` stays optional in the object and the pairing is a refinement, so
  // the clients already in the field keep validating: they send `{stars}`,
  // which is still exactly one of the two.
  rating: z
    .object({
      stars: z.number().int().min(1).max(5).optional(),
      not_found: z.literal(true).optional(),
      visited: z.boolean().optional(),
    })
    .loose()
    .refine(p => (p.stars === undefined) !== (p.not_found === undefined), {
      message: 'a rating carries either stars or not_found, never both',
    }),
  // distance_m and accuracy_m are what make a visit worth anything: the 50 m
  // radius the phone applies is a guess, and keeping both numbers means it
  // can be tightened later over rows already collected. Bounded generously
  // rather than at 50, so a client that loosens its own radius does not start
  // getting 400s from a server that was never asked about it.
  visit: z
    .object({
      distance_m: z.number().min(0).max(100_000),
      accuracy_m: z.number().min(0).max(100_000).nullable().optional(),
      // THE DAY THE AUTHOR'S PHONE SAYS IT WAS, in its own timezone.
      //
      // Here because only that phone knows. We stamp `server_ts` in UTC,
      // and a reader deriving the day from it files a Swedish evening walk
      // after ten under tomorrow -- which matters because the phones
      // deduplicate visits per author per place per DAY, so two devices
      // were using two different calendars. The server cannot fix it: it
      // does not know the timezone and must not guess it from an IP.
      //
      // Optional, because every client in the field today sends nothing and
      // keeps working. Validated as a plain calendar day rather than
      // accepted as a string: readers put it in a UNIQUE index, so a client
      // sending rubbish would get to decide what counts as a duplicate of
      // what. Not range-checked beyond the shape -- a wrong day costs its
      // own author a deduplication and nobody else anything.
      visit_day: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .loose(),
  // Anonymous, and that is a deliberate exception to the rule above it: a
  // sign either exists or does not, so a wrong answer is corrected by the
  // next visitor rather than being someone's speech. The register knows this
  // for 105 places out of 251,014, which is why it is worth collecting at
  // all.
  // Three-valued, because 'unsure' is an answer: the person was there and
  // could not tell, and a sign nobody can find is a sign that does nothing.
  // `has_sign` stays accepted on its own so the clients already in the field
  // keep validating, and is sent alongside `answer` by newer ones for yes and
  // no -- but never for unsure, which has no boolean to be.
  sign: z
    .object({
      answer: z.enum(['yes', 'no', 'unsure']).optional(),
      has_sign: z.boolean().optional(),
    })
    .loose()
    .refine(p => p.answer !== undefined || p.has_sign !== undefined, {
      message: 'a sign event carries answer or has_sign',
    }),
  // "Have you been here?" -- the answer that gates rating and sign on the
  // phone. Anonymous for the same reason a visit is: it is a statement about
  // the author, not about anybody else.
  //
  // `had_visit` is whether the phone's GPS agreed at the time, and the pair
  // is kept rather than collapsed because the DISAGREEMENT is the valuable
  // case: been = false with a recorded visit is a site somebody walked within
  // fifty metres of and never saw, which is close to the strongest negative
  // this app can collect.
  presence: z.object({ been: z.boolean(), had_visit: z.boolean() }).loose(),
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
 * The salt, read once per server instance and remembered.
 *
 * It lives in the database rather than in an environment variable so there is
 * nothing to set, nothing to copy when the project moves, and no deploy that
 * quietly loses rate limiting because a variable was forgotten. One extra
 * query per cold start.
 */
let saltCache: string | null = null;

async function ipSalt(): Promise<string | null> {
  if (saltCache) {
    return saltCache;
  }
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM fl_config WHERE key = 'ip_salt'"
  );
  saltCache = rows[0]?.value ?? null;
  return saltCache;
}

/**
 * A salted hash of the caller's address.
 *
 * Enough to count requests, useless as a record of where somebody was. The
 * salt is not optional: an unsalted hash of an IPv4 address is reversible by
 * trying all four billion of them, which would make this a log of where
 * people have been instead of a counter.
 */
async function ipHash(request: NextRequest): Promise<string | null> {
  const salt = await ipSalt();
  if (!salt) {
    return null;
  }
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';
  if (!ip) {
    return null;
  }
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

  // PUBLISHING NEEDS AN ACCOUNT, checked once for the request rather than per
  // row: it is a property of the caller, not of what they sent.
  //
  // `reason` is what the app matches on. The prose is for a human reading a
  // log, and matching on it would break the day somebody rewords it.
  //
  // THE ROWS ARE NOT HELD AGAINST ON THIS PATH. A phone with a queue and no
  // account has done nothing wrong and its contributions have to survive
  // until it has one -- see flush() in the app, which does not count this
  // refusal against a row's attempts.
  const { rows: link } = await pool.query<{ account: string }>(
    'SELECT account FROM fl_account_devices WHERE device = $1',
    [author]
  );
  if (!link.length) {
    return NextResponse.json(
      { error: 'sign in to publish', reason: 'account_required' },
      { status: 403 }
    );
  }

  for (const e of body.events) {
    if (UNMODERATED_KINDS.has(e.kind)) {
      // An account is not the missing piece here -- moderation is. See
      // UNMODERATED_KINDS.
      return NextResponse.json(
        {
          error: `kind "${e.kind}" cannot be published until there is a way to moderate it`,
          reason: 'unmoderated',
          kind: e.kind,
        },
        { status: 403 }
      );
    }
    if (SERVER_KINDS.has(e.kind)) {
      return NextResponse.json(
        { error: `kind "${e.kind}" is written by the server only` },
        { status: 400 }
      );
    }
    if (!KINDS.has(e.kind)) {
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
    // A RETRACTION HAS TO BE YOUR OWN, and until now only the phones checked
    // that. applyRemote does `UPDATE comments ... AND author = ?`, so a
    // forged comment_delete already had no effect on anybody's database --
    // but the whole protection lived in the clients, and the log would still
    // have accepted a row asserting something false. The next reader that
    // does not happen to implement the same check inherits the hole.
    //
    // Own by ACCOUNT and not by device, because two phones on one account are
    // one person: somebody who comments from their phone must be able to
    // delete it from their tablet, which is exactly what the pseudonym in the
    // feed already tells every reader.
    if (e.kind === 'comment_delete') {
      const target = (e.payload as { target_event_id?: string })
        .target_event_id;
      const { rows: own } = await pool.query(
        `SELECT 1
           FROM fl_events t
           LEFT JOIN fl_account_devices d ON d.device = t.author
          WHERE t.event_id = $1
            AND t.kind = 'comment'
            AND COALESCE(d.account, t.author) = $2`,
        [target, link[0].account ?? author]
      );
      if (!own.length) {
        return NextResponse.json(
          {
            error: 'a comment can only be retracted by its author',
            event_id: e.event_id,
          },
          { status: 403 }
        );
      }
    }
  }

  const ip = await ipHash(request);
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
            // Stored without the author id the phone puts inside it. The
            // read side strips it too, for the rows written before this, but
            // not writing it in the first place is what stops the database
            // from being a list of write credentials.
            JSON.stringify(cleanPayload(e.payload)),
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
    // THE COUNTER IS READ FIRST, AND THE ORDER IS THE WHOLE CORRECTNESS
    // ARGUMENT. These are two queries with no transaction around them, so
    // something can commit between them; which way that hurts depends
    // entirely on which one goes first.
    //
    // Reading the events first was wrong. If the window came back empty --
    // it held only the caller's own events, or nothing at all -- the cursor
    // was set to the counter read AFTERWARDS, so an event committed by
    // another author in between was jumped over and never sent to this
    // device again. Silent, permanent, and exactly the case the counter was
    // there to prevent.
    //
    // This way round the cursor can only ever lag. If rows come back, it is
    // the last row actually handed over. If none do, it is a value read
    // BEFORE anyone could have looked, so anything committed since is still
    // `> cursor` and arrives in the next window. No transaction and no
    // FOR SHARE needed: lagging is free, skipping is not.
    const { rows: head } = await pool.query<{ v: string }>(
      'SELECT v FROM fl_event_seq WHERE id = 1'
    );
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
    const seq = rows.length
      ? Number(rows[rows.length - 1].seq)
      : Number(head[0]?.v ?? since);

    // Resolved once for the DISTINCT authors in the window, plus the caller,
    // rather than once per row: 500 events from a handful of contributors is
    // a handful of hashes and one query.
    const distinct = [...new Set([...rows.map(r => r.author), author])];
    const pseudonyms = await publicAuthors(distinct);
    if (!pseudonyms) {
      // See publicAuthor: never serve a window with authors missing.
      console.error('fl_events read: author_salt unavailable');
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }

    return NextResponse.json({
      seq,
      // The caller's OWN pseudonym, which it cannot work out for itself
      // because it does not have the salt. The phone needs it to recognise
      // its own contributions among the ones it downloads: a second device on
      // the same account will pull the first device's events, and without
      // this it would count its own person twice -- its local rows are keyed
      // by its raw device id, the downloaded ones by the shared pseudonym.
      me: pseudonyms.get(author),
      events: rows.map(r => ({
        seq: Number(r.seq),
        event_id: r.event_id,
        kind: r.kind,
        uuid: r.place_uuid,
        // NOT r.author: that value is the author's write credential. See
        // publicAuthor.
        author: pseudonyms.get(r.author),
        server_ts: new Date(r.server_ts).toISOString(),
        // Stripped of the author id it also carries. See cleanPayload.
        payload: cleanPayload(r.payload),
      })),
    });
  } catch (e) {
    console.error('fl_events read failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

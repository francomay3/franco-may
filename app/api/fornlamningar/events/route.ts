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

const ANONYMOUS_KINDS = new Set([
  'rating',
  'visit',
  'favourite',
  'sign',
  'presence',
]);
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
    .refine((p) => (p.stars === undefined) !== (p.not_found === undefined), {
      message: "a rating carries either stars or not_found, never both",
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
    .refine((p) => p.answer !== undefined || p.has_sign !== undefined, {
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
  presence: z
    .object({ been: z.boolean(), had_visit: z.boolean() })
    .loose(),
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
 * The salt that turns an author id into the pseudonym other clients see.
 *
 * Its own value and its own cache, not shared with ip_salt, because the two
 * have opposite lifetimes: ip_salt could be rotated tomorrow and cost nothing
 * but an hour of rate-limit counts, while rotating this one resets every
 * reader's idea of who said what. Sharing one value would mean a rotation
 * intended for the cheap purpose silently performing the expensive one.
 */
let authorSaltCache: string | null = null;

async function authorSalt(): Promise<string | null> {
  if (authorSaltCache) {
    return authorSaltCache;
  }
  const { rows } = await pool.query<{ value: string }>(
    "SELECT value FROM fl_config WHERE key = 'author_salt'"
  );
  authorSaltCache = rows[0]?.value ?? null;
  return authorSaltCache;
}

/**
 * The id of an author as OTHER clients are allowed to see it.
 *
 * THE RAW AUTHOR ID IS A CREDENTIAL, and it used to be handed out here. An
 * author id in `X-Author-Id` is the entire proof of who you are, so echoing
 * other people's back in the feed gave every syncing device the write
 * credentials of everyone who had contributed before it: enough to rate in
 * their name, to burn their rate limit, and -- once comments exist -- to
 * delete their words, because comment_delete checks that the author matches
 * and the attacker would be holding exactly that author.
 *
 * A salted hash instead. Stable, so "one vote per author" still works for
 * readers; irreversible, so it is not a credential. Truncated to 32 hex
 * characters, which is 128 bits: far past any collision worth worrying about
 * at this scale, and short enough to be cheap to store on every phone.
 *
 * Returns null when the salt cannot be read, and the caller then FAILS the
 * request rather than serving events without an author. Degrading looks like
 * the safer option and is not: the reader's cursor advances past whatever it
 * was sent, so a window served without authors is a window that can never be
 * fetched again. Those events would be silently lost from every aggregate,
 * for good. A 500 is retried; a gap is not.
 */
/**
 * A payload with the author's id taken out of it.
 *
 * The same leak as publicAuthor, through a second door. The phone builds each
 * payload with `author` inside it as well as in the header, and payload
 * schemas are `.loose()` so the extra key is stored verbatim -- which means
 * hashing the top-level author while serving the payload untouched would have
 * published the very credential the hash exists to hide. Every event already
 * in the database has one of these, so this has to strip on READ and not only
 * refuse on write.
 *
 * `event_id` and `uuid` come out too. They are not secret -- they are
 * alongside the payload as real columns -- but a duplicate that readers might
 * start trusting is a second source of truth waiting to disagree with the
 * first.
 */
function cleanPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const { author: _a, event_id: _e, uuid: _u, ...rest } = payload as Record<
    string,
    unknown
  >;
  return rest;
}

async function publicAuthor(author: string): Promise<string | null> {
  const salt = await authorSalt();
  if (!salt) {
    return null;
  }
  return createHash('sha256').update(salt).update(author).digest('hex').slice(0, 32);
}

/**
 * Pseudonyms for a set of author ids, with an account's devices sharing one.
 *
 * THIS IS WHERE TWO PHONES BECOME ONE PERSON. The canonical id is the account
 * when the device has been linked to one, and the device id otherwise, and
 * only then is it hashed. So a reader counting "one vote per author" counts
 * one vote for someone who rated from their phone and their tablet -- without
 * a single event being rewritten, and without the device-to-account link ever
 * leaving the server, which matters because that link contains a write
 * credential.
 *
 * One query for the whole window rather than one per author. It is not
 * cached: a link created a second ago has to take effect on the next read, and
 * a per-instance cache would leave some serverless instances grouping an
 * account's devices and others not, which is a difference nobody could debug
 * from the outside.
 */
async function publicAuthors(
  authors: string[]
): Promise<Map<string, string> | null> {
  const out = new Map<string, string>();
  if (!authors.length) {
    return out;
  }
  const { rows } = await pool.query<{ device: string; account: string }>(
    'SELECT device, account FROM fl_account_devices WHERE device = ANY($1)',
    [authors]
  );
  const accountOf = new Map(rows.map(r => [r.device, r.account]));
  for (const a of authors) {
    const pub = await publicAuthor(accountOf.get(a) ?? a);
    if (!pub) {
      return null;
    }
    out.set(a, pub);
  }
  return out;
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

import { createHash } from 'crypto';
import { pool } from '@/lib/db';

/**
 * Turning author ids into the pseudonyms readers are allowed to see.
 *
 * Extracted from the events route when a second reader appeared -- the
 * moderation route, which must not serve raw author ids either, admin or
 * not. A device id is a write credential; who gets to see one does not
 * depend on how trusted the viewer is, because the value is a key and not a
 * name. Two copies of the salt logic would be two places that can disagree
 * about identity, which is the one thing here that cannot be allowed to
 * drift.
 */

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
export function cleanPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const {
    author: _a,
    event_id: _e,
    uuid: _u,
    ...rest
  } = payload as Record<string, unknown>;
  return rest;
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
export async function publicAuthor(author: string): Promise<string | null> {
  const salt = await authorSalt();
  if (!salt) {
    return null;
  }
  return createHash('sha256')
    .update(salt)
    .update(author)
    .digest('hex')
    .slice(0, 32);
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
export async function publicAuthors(
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

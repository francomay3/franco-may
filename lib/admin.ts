import { NextRequest } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-token';

/**
 * Is this request from the one person allowed to moderate?
 *
 * SAME IDENTITY AS THE APP, deliberately. The phone already signs in with
 * Google through Firebase and this service already verifies those tokens with
 * `jose` and no service-account key, so moderating from the web needs no
 * second identity system -- no password to store, no reset flow to build, no
 * hash to leak, and nothing private in Vercel. A second way of knowing who
 * somebody is is a second thing that can disagree with the first.
 *
 * BY uid, NOT BY EMAIL. The email in a Firebase token is whatever the
 * provider said this time: it can change, and switching from Google sign-in
 * to any other provider changes it. The uid is stable for the life of the
 * account, which is what an authorisation list needs.
 *
 * FL_ADMIN_UIDS is a comma-separated list, and it ADDS to the one below
 * rather than replacing it. Empty or absent is therefore not "nobody", which
 * was the earlier design and was the wrong kind of careful: it made the
 * feature depend on a variable being set in a dashboard, and a deploy that
 * forgot it would look like a bug in the sign-in.
 *
 * A UID IN SOURCE IS NOT A LEAK. It authorises nothing on its own -- it only
 * matches against a Firebase token this server verified against Google's
 * keys, which nobody else can mint for this account. It is a name, not a key,
 * and the repository is Franco's own site.
 *
 * The bootstrap stays for anyone added later: an unrecognised but VALID token
 * gets its own uid shown back to it, so it can be pasted into the variable.
 * Knowing your own uid grants nothing either.
 */

/** Franco. See above for why this is in the file and not in a dashboard. */
const OWNER = 'vQCtnlYDZPa5uilEqDT8IVwA5V92';
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await verifyFirebaseToken(request.headers.get('authorization'));
  if (!user) {
    return false;
  }
  return adminUids().has(user.uid);
}

/**
 * The uid of a valid token, admin or not, or null if the token is not valid.
 *
 * Only the bootstrap route uses this, and only to tell somebody their own
 * uid. It is separate from isAdmin so that no handler can accidentally treat
 * "has a Google account" as "may moderate".
 */
export async function uidOf(request: NextRequest): Promise<string | null> {
  const user = await verifyFirebaseToken(request.headers.get('authorization'));
  return user?.uid ?? null;
}

function adminUids(): Set<string> {
  return new Set([
    OWNER,
    ...(process.env.FL_ADMIN_UIDS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  ]);
}

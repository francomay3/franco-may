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
 * FL_ADMIN_UIDS is a comma-separated list. Absent or empty means NOBODY is an
 * admin, which is the right way to fail: a missing variable must not open the
 * door. That is also the bootstrap problem -- the first sign-in cannot know
 * its own uid -- and it is solved in the page rather than here: an
 * unrecognised but VALID token gets its uid shown back to it, so it can be
 * pasted into the variable. Knowing your own uid grants nothing.
 */
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
  return new Set(
    (process.env.FL_ADMIN_UIDS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
}

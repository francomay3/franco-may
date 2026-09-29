import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, uidOf } from '@/lib/admin';

/**
 * Whether this token may open the admin.
 *
 * The moderation feed used to be the only door, so it was also the only
 * place a valid account that is not on the list could learn its own uid.
 * The dashboard is that door now. An invalid token still gets 404.
 */
export async function GET(request: NextRequest) {
  if (await isAdmin(request)) {
    return NextResponse.json({ ok: true });
  }
  const uid = await uidOf(request);
  if (uid) {
    return NextResponse.json(
      { error: 'not an admin', reason: 'not_listed', uid },
      { status: 403 }
    );
  }
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}

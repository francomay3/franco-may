import { NextRequest, NextResponse } from 'next/server';

import { tx } from '@/lib/db';
import { verifyFirebaseToken } from '@/lib/firebase-token';

/**
 * Attach this device's anonymous id to a signed-in account.
 *
 * Two proofs arrive together and neither is sufficient alone:
 *
 *   Authorization: Bearer <firebase id token>   -- you are this account
 *   X-Author-Id:   <device uuid>                -- you hold this device's id
 *
 * The device id is a secret only that device has, so presenting both is proof
 * that the person who owns the account also owns the device. Without the
 * header anyone could claim any device; without the token anyone could claim
 * any account.
 *
 * NOTHING IS REWRITTEN. The events this device has already written keep the
 * author they were written with, and always will -- the log is append-only.
 * All this does is record that two ids are the same person, which the feed
 * then uses to give them one pseudonym. That is why signing in on a second
 * phone is a single INSERT and not a migration.
 *
 * AND THE LINK IS NEVER SERVED. It maps a public account id to a device id,
 * and the device id is a write credential; publishing the pair would undo the
 * pseudonym completely. This endpoint writes it and the feed joins against
 * it. Nothing returns it.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const device = request.headers.get('x-author-id')?.trim() ?? '';
  if (!UUID.test(device)) {
    return NextResponse.json(
      { error: 'missing or malformed X-Author-Id' },
      { status: 401 }
    );
  }

  const user = await verifyFirebaseToken(request.headers.get('authorization'));
  if (!user) {
    return NextResponse.json(
      { error: 'missing or invalid bearer token' },
      { status: 401 }
    );
  }

  try {
    const linked = await tx(async c => {
      await c.query(
        `INSERT INTO fl_accounts (id, provider) VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [user.uid, user.provider]
      );

      // A device already attached to a DIFFERENT account is the one case
      // worth refusing rather than silently resolving. Moving it would hand
      // one person's past contributions to another account, and the
      // plausible ways to get here -- a shared phone, a second account by
      // mistake -- are all better answered by saying no.
      const { rows } = await c.query<{ account: string }>(
        'SELECT account FROM fl_account_devices WHERE device = $1',
        [device]
      );
      const existing = rows[0]?.account;
      if (existing && existing !== user.uid) {
        return false;
      }
      await c.query(
        `INSERT INTO fl_account_devices (device, account) VALUES ($1, $2)
         ON CONFLICT (device) DO NOTHING`,
        [device, user.uid]
      );
      return true;
    });

    if (!linked) {
      return NextResponse.json(
        { error: 'this device is already linked to another account' },
        { status: 409 }
      );
    }

    // The account id goes back so the phone can remember whose it is. The
    // device id does not need to come back -- the phone already has it -- and
    // no other device's does either.
    return NextResponse.json({ ok: true, account: user.uid });
  } catch (e) {
    console.error('fl link failed', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { placeRows } from '@/lib/fl-place-list';

/**
 * Every place for the admin table.
 *
 * 404 and not 403, same as the other admin routes: telling a stranger the
 * list exists is the reconnaissance the rest of this surface refuses.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  try {
    return NextResponse.json({ places: await placeRows() });
  } catch (e) {
    console.error('place list failed', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

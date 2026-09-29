import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { searchPlaces } from '@/lib/fl-search';

/**
 * Admin place search. 404 and not 403, same as the other admin routes.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const q = request.nextUrl.searchParams.get('q') ?? '';
  try {
    return NextResponse.json(searchPlaces(q));
  } catch (e) {
    console.error('place search failed', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

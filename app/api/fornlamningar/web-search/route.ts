import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

/**
 * Web results for the place desk, rendered here as links.
 *
 * Brave's own index, asked in Swedish and biased to Sweden. The key stays
 * on the server. 404 and not 403, same as the other admin routes.
 */

type BraveHit = {
  title?: string;
  url?: string;
  description?: string;
};

const pending = new Map<
  string,
  Promise<{ title: string; url: string; snippet: string }[]>
>();

async function brave(q: string, key: string) {
  const existing = pending.get(q);
  if (existing) {
    return existing;
  }
  const run = (async () => {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', q);
    url.searchParams.set('count', '8');
    url.searchParams.set('country', 'SE');
    url.searchParams.set('search_lang', 'sv');
    url.searchParams.set('result_filter', 'web');
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': key,
      },
    });
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const body = (await res.json()) as { web?: { results?: BraveHit[] } };
    return (body.web?.results ?? []).flatMap(hit => {
      if (!hit.title || !hit.url) {
        return [];
      }
      return [
        {
          title: hit.title,
          url: hit.url,
          snippet: hit.description ?? '',
        },
      ];
    });
  })().finally(() => {
    pending.delete(q);
  });
  pending.set(q, run);
  return run;
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q || q.length > 400) {
    return NextResponse.json({ error: 'bad query' }, { status: 400 });
  }
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'search is not configured' },
      { status: 500 }
    );
  }
  try {
    return NextResponse.json({ results: await brave(q, key) });
  } catch (e) {
    const status = e instanceof Error ? e.message : 'failed';
    console.error('web search failed', status);
    return NextResponse.json({ error: status }, { status: 502 });
  }
}

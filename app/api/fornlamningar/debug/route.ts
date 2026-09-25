import { NextRequest, NextResponse } from 'next/server';

/**
 * The laptop cannot open Postgres on 5432 (the handshake is reset). Neon's
 * SQL endpoint on 443 is the same query the pool would run, and it works
 * from here. Production can use it too: one place, two small selects.
 */
async function sql(query: string, params: unknown[]) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('no DATABASE_URL');
  const res = await fetch(`https://${new URL(url).hostname}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': url,
    },
    body: JSON.stringify({ query, params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return (JSON.parse(text).rows ?? []) as Record<string, unknown>[];
}

/**
 * Read-only source list for the map popup. The map is a debug surface: the
 * same texts the admin page shows, without the moderation actions or the
 * sign-in. One place per request, looked up by the uuid the pin already has.
 */

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!uuid) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }

  const [texts, added] = await Promise.all([
    sql(
      `SELECT source_id, kind, lang, title, body, author, publisher,
              licence, url, trust, used, fetched_at
         FROM fl_sources
        WHERE place_uuid = $1
        ORDER BY used DESC, trust DESC NULLS LAST, source_id`,
      [uuid]
    ),
    sql(
      `SELECT id, kind, lang, title, body, publisher, licence, url, created_at
         FROM fl_sources_added
        WHERE place_uuid = $1 AND removed_at IS NULL
        ORDER BY id`,
      [uuid]
    ),
  ]);

  const known = new Set(texts.map(r => r.url).filter(Boolean));

  return NextResponse.json({
    texts: [
      ...added
        .filter(r => !r.url || !known.has(r.url))
        .map(r => ({
          source_id: -Number(r.id),
          added_id: Number(r.id),
          kind: r.kind,
          lang: r.lang,
          title: r.title,
          body: r.body,
          author: null,
          publisher: r.publisher,
          licence: r.licence,
          url: r.url,
          used: false,
        })),
      ...texts.map(r => ({
        source_id: Number(r.source_id),
        added_id: null,
        kind: r.kind,
        lang: r.lang,
        title: r.title,
        body: r.body,
        author: r.author,
        publisher: r.publisher,
        licence: r.licence,
        url: r.url,
        used: r.used,
      })),
    ],
  });
}

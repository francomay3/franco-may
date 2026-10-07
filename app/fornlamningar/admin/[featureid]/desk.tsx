'use client';

import React, { useEffect, useState } from 'react';
import { PlaceMap } from '../PlaceMap';

/**
 * The reference column: satellite (or the named map), Street View, the pin,
 * and web results for the title plus the municipality.
 *
 * A pass searches on its own, once per query, and keeps the answer in the
 * tab so coming back does not ask again. Opening a place on its own waits
 * for the button.
 */

type Hit = { title: string; url: string; snippet: string };

const cache = new Map<string, Hit[]>();
const pending = new Map<string, Promise<Hit[]>>();

function cached(q: string): Hit[] | null {
  const held = cache.get(q);
  if (held) {
    return held;
  }
  try {
    const raw = sessionStorage.getItem(`fl-web:${q}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Hit[];
    if (!Array.isArray(parsed)) {
      return null;
    }
    cache.set(q, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function remember(q: string, hits: Hit[]) {
  cache.set(q, hits);
  try {
    sessionStorage.setItem(`fl-web:${q}`, JSON.stringify(hits));
  } catch {
    // The tab can fill up. The answer still stands for this page.
  }
}

function searchQuery(
  title: string | null,
  municipality: string | null
): string {
  const name = (title ?? '').trim().replace(/"/g, '');
  const kommun = (municipality ?? '').trim();
  const quoted = name ? `"${name}"` : '';
  const where = kommun ? `${kommun} kommun` : '';
  return [quoted, where].filter(Boolean).join(' ');
}

async function search(token: string, q: string): Promise<Hit[]> {
  const hit = cached(q);
  if (hit) {
    return hit;
  }
  const inflight = pending.get(q);
  if (inflight) {
    return inflight;
  }
  const run = (async () => {
    const res = await fetch(
      `/api/fornlamningar/web-search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const failed = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(failed.error ?? String(res.status));
    }
    const body = (await res.json()) as { results?: Hit[] };
    const results = (body.results ?? []).filter(
      row => row && typeof row.title === 'string' && typeof row.url === 'string'
    );
    remember(q, results);
    return results;
  })().finally(() => {
    pending.delete(q);
  });
  pending.set(q, run);
  return run;
}

function embedSrc(
  key: string,
  lat: number,
  lon: number,
  mode: 'satellite' | 'roadmap' | 'street'
): string {
  const at = `${lat},${lon}`;
  if (mode === 'street') {
    return `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${at}&fov=90&language=sv`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${at}&zoom=17&maptype=${mode}&language=sv`;
}

export function PlaceDesk({
  lat,
  lon,
  mapKey,
  draggable,
  onMove,
  pinForced,
  pinBusy,
  onClearPin,
  token,
  title,
  municipality,
  autoSearch,
}: {
  lat: number | null;
  lon: number | null;
  mapKey: string | null;
  draggable: boolean;
  onMove: (lon: number, lat: number) => void;
  pinForced: boolean;
  pinBusy: boolean;
  onClearPin: () => void;
  token: string;
  title: string | null;
  municipality: string | null;
  autoSearch: boolean;
}) {
  const [satellite, setSatellite] = useState(true);
  const seed = searchQuery(title, municipality);
  const [text, setText] = useState(seed);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setText(seed);
    setHits(null);
    setError(null);
    if (!autoSearch || !seed) {
      return;
    }
    let gone = false;
    setBusy(true);
    void search(token, seed)
      .then(results => {
        if (!gone) {
          setHits(results);
        }
      })
      .catch(e => {
        if (!gone) {
          setError(e instanceof Error ? e.message : 'failed');
        }
      })
      .finally(() => {
        if (!gone) {
          setBusy(false);
        }
      });
    return () => {
      gone = true;
    };
  }, [autoSearch, seed, token]);

  const run = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setHits(await search(token, trimmed));
    } catch (e) {
      setHits(null);
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  };

  const located = lat != null && lon != null;

  return (
    <aside className="fl-desk-side">
      {located && mapKey ? (
        <>
          <div className="fl-map-toggle">
            <button
              type="button"
              className="fl-quiet"
              aria-pressed={satellite}
              onClick={() => setSatellite(true)}
            >
              Satellite
            </button>
            <button
              type="button"
              className="fl-quiet"
              aria-pressed={!satellite}
              onClick={() => setSatellite(false)}
            >
              Map
            </button>
          </div>
          <iframe
            className="fl-embed"
            title="Satellite map"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            src={embedSrc(
              mapKey,
              lat,
              lon,
              satellite ? 'satellite' : 'roadmap'
            )}
          />
          <iframe
            className="fl-embed fl-embed-street"
            title="Street View"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            src={embedSrc(mapKey, lat, lon, 'street')}
          />
        </>
      ) : located ? (
        <p className="fl-empty">Google Maps is not configured.</p>
      ) : (
        <p className="fl-empty">No coordinate for this place.</p>
      )}

      {located ? (
        <>
          <PlaceMap lon={lon} lat={lat} draggable={draggable} onMove={onMove} />
          <div className="fl-pin">
            <p className="fl-sub">
              {pinForced
                ? 'Forced position. After the next pipeline run the app stands here.'
                : 'Drag the pin to where it should stand. After the next pipeline run the app uses it.'}
            </p>
            {pinForced ? (
              <button
                type="button"
                className="fl-quiet"
                disabled={pinBusy}
                onClick={onClearPin}
              >
                Reset pin
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      <form
        className="fl-web"
        onSubmit={e => {
          e.preventDefault();
          if (!busy) {
            void run(text);
          }
        }}
      >
        <input
          aria-label="Web search"
          value={text}
          maxLength={400}
          onChange={e => setText(e.currentTarget.value)}
        />
        <button
          type="submit"
          className="fl-add-button"
          disabled={busy || !text.trim()}
        >
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error ? <p className="fl-empty">Search failed ({error}).</p> : null}
      {hits && hits.length === 0 ? (
        <p className="fl-empty">Nothing came back.</p>
      ) : null}
      {hits && hits.length > 0 ? (
        <div className="fl-web-hits">
          {hits.map(hit => (
            <a
              key={hit.url}
              className="fl-web-hit"
              href={hit.url}
              target="_blank"
              rel="noreferrer"
            >
              <strong>{hit.title}</strong>
              <span>{hit.snippet}</span>
            </a>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

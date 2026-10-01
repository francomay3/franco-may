'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Loader } from '@mantine/core';
import {
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AdminGate } from '../gate';
import DescriptionText from '../../DescriptionText';

/**
 * Two places, one question: which is more striking at a glance.
 *
 * The probability is not on the screen while the pair is open. It comes
 * back with the vote, about the pair just judged, and the next pair is
 * already fitted with that vote included. A tie says the two are equal and
 * trains. Skip stores the pair and does not.
 */

type Side = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lon: number;
};

type Pair = {
  left: Side;
  right: Side;
  votes: number;
  skips: number;
};

type Reveal = {
  pLeft: number;
  basis: 'prior' | 'votes';
  leftName: string;
  rightName: string;
  outcome: 'left' | 'right' | 'tie' | 'skip';
};

type ArchivePhoto = {
  source: string;
  file: string;
  thumb: string;
  ord: number;
  prioritized: boolean;
  skipped: boolean;
};

type Place = {
  uuid: string | null;
  title: string | null;
  content: string | null;
  lon: number | null;
  lat: number | null;
  sources: { file: string }[];
  archive: ArchivePhoto[];
};

const STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [{ id: 'satellite', type: 'raster' as const, source: 'satellite' }],
};

function commonsThumb(file: string): string {
  let name = file;
  try {
    name = decodeURIComponent(file);
  } catch {
    name = file;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=800`;
}

function lead(content: string | null): string {
  if (!content) {
    return '';
  }
  const para = content.split(/\n\s*\n/).find(p => p.trim()) ?? '';
  return para.trim();
}

function meters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371000;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function shots(place: Place | null): {
  src: string;
  source?: string;
  file?: string;
  prioritized: boolean;
}[] {
  if (!place) {
    return [];
  }
  const archive = (place.archive ?? [])
    .filter(p => !p.skipped && p.thumb)
    .sort(
      (a, b) => Number(b.prioritized) - Number(a.prioritized) || a.ord - b.ord
    );
  if (archive.length) {
    return archive.slice(0, 4).map(p => ({
      src: p.thumb,
      source: p.source,
      file: p.file,
      prioritized: p.prioritized,
    }));
  }
  return (place.sources ?? [])
    .filter(s => s.file)
    .slice(0, 4)
    .map(s => ({ src: commonsThumb(s.file), prioritized: false }));
}

function revealCopy(r: Reveal): string {
  const lead =
    r.outcome === 'skip'
      ? 'Skipped.'
      : r.outcome === 'tie'
        ? 'Tie.'
        : `You picked ${(r.outcome === 'left' ? r.leftName : r.rightName) || 'that side'}.`;
  if (r.basis !== 'votes') {
    return `${lead} Not enough votes yet to call a side.`;
  }
  const favoredLeft = r.pLeft >= 0.5;
  const name = favoredLeft ? r.leftName : r.rightName;
  const pct = Math.round(100 * (favoredLeft ? r.pLeft : 1 - r.pLeft));
  return `${lead} Your votes had ${name || 'one side'} at ${pct}%.`;
}

function GlanceMap({
  points,
}: {
  points: { lon: number; lat: number; color: string }[];
}) {
  const ref = useRef<MapRef>(null);
  const lon = points.reduce((s, p) => s + p.lon, 0) / (points.length || 1);
  const lat = points.reduce((s, p) => s + p.lat, 0) / (points.length || 1);
  const zoom = points.length <= 1 ? 16 : 14;
  const view = `${lon.toFixed(5)},${lat.toFixed(5)},${zoom}`;

  const move = useCallback(() => {
    ref.current?.jumpTo({ center: [lon, lat], zoom });
  }, [lon, lat, zoom]);

  useEffect(() => {
    move();
  }, [move]);

  if (!points.length) {
    return null;
  }
  return (
    <div className="fl-map fl-compare-map">
      <Map
        ref={ref}
        key={view}
        initialViewState={{ longitude: lon, latitude: lat, zoom }}
        onLoad={move}
        mapStyle={STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {points.map(p => (
          <Marker
            key={`${p.color}:${p.lon}:${p.lat}`}
            longitude={p.lon}
            latitude={p.lat}
            color={p.color}
          />
        ))}
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    </div>
  );
}

function Column({
  side,
  place,
  token,
  color,
  showMap,
  onPrioritize,
}: {
  side: Side;
  place: Place | null;
  token: string;
  color: string;
  showMap: boolean;
  onPrioritize: () => void;
}) {
  const title =
    place?.uuid === side.id
      ? place.title || side.name || side.id
      : side.name || side.id;
  const photos = place?.uuid === side.id ? shots(place) : [];
  const text = place?.uuid === side.id ? lead(place.content) : '';
  const lon =
    place?.uuid === side.id && place.lon != null ? place.lon : side.lon;
  const lat =
    place?.uuid === side.id && place.lat != null ? place.lat : side.lat;
  const putFirst = async (source: string, file: string) => {
    const res = await fetch('/api/fornlamningar/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'prioritize_photo',
        place: side.id,
        source,
        file,
        prioritized: true,
      }),
    });
    if (res.ok) {
      onPrioritize();
    }
  };
  return (
    <article className="fl-compare-col" key={side.id}>
      <header>
        <h2 className="fl-compare-name">{title}</h2>
        {side.kind ? <p className="fl-sub">{side.kind}</p> : null}
        <Link
          className="fl-compare-open"
          href={`/fornlamningar/admin/${side.id}`}
          target="_blank"
        >
          Open the place
        </Link>
      </header>
      {photos.length === 0 ? (
        <p className="fl-empty">No photograph held for this place.</p>
      ) : (
        <div className="fl-sources">
          {photos.map((p, i) => (
            <div
              key={`${side.id}:${p.file ?? p.src}:${i}`}
              className="fl-source"
            >
              <img src={p.src} alt="" />
              {p.source && p.file ? (
                <div>
                  <button
                    type="button"
                    className="fl-compare-first"
                    disabled={p.prioritized}
                    onClick={() => void putFirst(p.source!, p.file!)}
                  >
                    {p.prioritized ? 'First' : 'Put first'}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {text ? (
        <DescriptionText className="fl-prose" content={text} />
      ) : (
        <p className="fl-empty">No description published for this place.</p>
      )}
      {showMap ? <GlanceMap points={[{ lon, lat, color }]} /> : null}
    </article>
  );
}

function CompareBody({ token }: { token: string }) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [places, setPlaces] = useState<Record<string, Place>>({});
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = useRef<{ left: string; right: string }>({
    left: '',
    right: '',
  });

  const loadPlace = useCallback(
    async (id: string) => {
      const res = await fetch(
        `/api/fornlamningar/place?id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        return;
      }
      const body = (await res.json()) as Place;
      if (shown.current.left !== id && shown.current.right !== id) {
        return;
      }
      if (body.uuid && body.uuid !== id) {
        return;
      }
      setPlaces(prev => ({ ...prev, [id]: body }));
    },
    [token]
  );

  const applyPair = useCallback(
    (body: Pair) => {
      shown.current = { left: body.left.id, right: body.right.id };
      setPair(body);
      setPlaces({});
      void loadPlace(body.left.id);
      void loadPlace(body.right.id);
    },
    [loadPlace]
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/fornlamningar/compare', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      applyPair((await res.json()) as Pair);
    })();
  }, [token, applyPair]);

  const vote = async (outcome: Reveal['outcome']) => {
    if (!pair || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/fornlamningar/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          left: pair.left.id,
          right: pair.right.id,
          outcome,
        }),
      });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      const body = (await res.json()) as Reveal & { next: Pair | null };
      setReveal({
        pLeft: body.pLeft,
        basis: body.basis,
        leftName: leftTitle,
        rightName: rightTitle,
        outcome,
      });
      if (body.next?.left && body.next.right) {
        applyPair(body.next);
      } else {
        setPair(null);
        setError('No pair left.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (error && !pair) {
    return <p className="fl-empty">{error}</p>;
  }
  if (!pair) {
    return <Loader size="sm" />;
  }
  const leftPlace = places[pair.left.id] ?? null;
  const rightPlace = places[pair.right.id] ?? null;
  const leftAt = {
    lon: leftPlace?.lon ?? pair.left.lon,
    lat: leftPlace?.lat ?? pair.left.lat,
  };
  const rightAt = {
    lon: rightPlace?.lon ?? pair.right.lon,
    lat: rightPlace?.lat ?? pair.right.lat,
  };
  const together = meters(leftAt, rightAt) < 2000;
  const leftTitle = leftPlace?.title || pair.left.name || 'Left';
  const rightTitle = rightPlace?.title || pair.right.name || 'Right';

  return (
    <div className="fl-compare">
      <p className="fl-sub fl-compare-note">
        Which of these two is more striking at a glance. Tie when they are
        equal, skip when there is not enough to tell. {pair.votes} judged
        {pair.skips ? `, ${pair.skips} skipped` : ''}.
      </p>
      {reveal ? (
        <p className="fl-compare-reveal">{revealCopy(reveal)}</p>
      ) : null}
      {error ? <p className="fl-empty">{error}</p> : null}
      <div className="fl-compare-grid">
        <Column
          key={pair.left.id}
          side={pair.left}
          place={leftPlace}
          token={token}
          color="#8f3d2b"
          showMap={!together}
          onPrioritize={() => void loadPlace(pair.left.id)}
        />
        <Column
          key={pair.right.id}
          side={pair.right}
          place={rightPlace}
          token={token}
          color="#1f6b45"
          showMap={!together}
          onPrioritize={() => void loadPlace(pair.right.id)}
        />
        {together ? (
          <div className="fl-compare-span">
            <GlanceMap
              points={[
                { ...leftAt, color: '#8f3d2b' },
                { ...rightAt, color: '#1f6b45' },
              ]}
            />
          </div>
        ) : null}
      </div>
      <div className="fl-compare-bar">
        <Button disabled={busy} onClick={() => void vote('left')}>
          {leftTitle}
        </Button>
        <Button
          className="fl-compare-quiet"
          variant="default"
          disabled={busy}
          onClick={() => void vote('tie')}
        >
          Tie
        </Button>
        <Button
          className="fl-compare-quiet"
          variant="default"
          disabled={busy}
          onClick={() => void vote('skip')}
        >
          Skip
        </Button>
        <Button disabled={busy} onClick={() => void vote('right')}>
          {rightTitle}
        </Button>
      </div>
    </div>
  );
}

export default function Compare() {
  return (
    <AdminGate title="Compare">
      {token => <CompareBody token={token} />}
    </AdminGate>
  );
}

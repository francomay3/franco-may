'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ArchivePhoto = {
  source: string;
  file: string;
  thumb: string;
  page: string | null;
  author: string | null;
  licence: string | null;
  ord: number;
  prioritized: boolean;
};

const PAGE = 24;

function sourceLabel(source: string): string {
  if (source === 'commons_geosearch') {
    return 'Nearby';
  }
  if (source === 'arkiv') {
    return 'Archive';
  }
  if (source.startsWith('commons')) {
    return 'Commons';
  }
  if (source.startsWith('county')) {
    return 'County';
  }
  return source;
}

function keyOf(photo: { source: string; file: string }): string {
  return `${photo.source}\0${photo.file}`;
}

export function ArchivePicker({
  uuid,
  token,
  photos: initial,
}: {
  uuid: string;
  token: string;
  photos: ArchivePhoto[];
}) {
  const [photos, setPhotos] = useState(initial);
  const [visible, setVisible] = useState(PAGE);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marked = photos.filter(p => p.prioritized).length;
  const shown = useMemo(
    () => (onlyMarked ? photos.filter(p => p.prioritized) : photos),
    [onlyMarked, photos]
  );
  const slice = shown.slice(0, visible);
  const more = slice.length < shown.length;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !more) {
      return;
    }
    const root = node.closest('.fl-admin');
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(n => n + PAGE);
        }
      },
      { root: root instanceof Element ? root : null, rootMargin: '480px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [more, shown.length, visible]);

  const toggle = async (photo: ArchivePhoto) => {
    const key = keyOf(photo);
    const next = !photo.prioritized;
    setBusy(key);
    setError(null);
    setPhotos(list =>
      list.map(p => (keyOf(p) === key ? { ...p, prioritized: next } : p))
    );
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'prioritize_photo',
          place: uuid,
          source: photo.source,
          file: photo.file,
          prioritized: next,
        }),
      });
      if (!res.ok) {
        setPhotos(list =>
          list.map(p => (keyOf(p) === key ? { ...p, prioritized: !next } : p))
        );
        setError(`Could not save (${res.status})`);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fl-pick">
      <p className="fl-sub">
        {photos.length} photographs, {marked} prioritized. The app still
        receives six, and the prioritized ones go first. Mark the ones that show
        the place clearly.
      </p>
      <div className="fl-pick-nav">
        <button
          type="button"
          className="fl-pick-filter"
          aria-pressed={onlyMarked}
          onClick={() => {
            setOnlyMarked(v => !v);
            setVisible(PAGE);
          }}
        >
          {onlyMarked ? 'Show all' : 'Show prioritized'}
        </button>
        {more ? (
          <span className="fl-pick-range">
            {slice.length} of {shown.length}
          </span>
        ) : null}
      </div>
      {error ? <p className="fl-empty">{error}</p> : null}
      {slice.length === 0 ? (
        <p className="fl-empty">None prioritized yet.</p>
      ) : (
        <div className="fl-pick-grid">
          {slice.map(photo => {
            const key = keyOf(photo);
            const credit =
              [photo.author, photo.licence].filter(Boolean).join(' · ') ||
              'No credit';
            return (
              <article
                key={key}
                className={
                  photo.prioritized ? 'fl-pick-card is-on' : 'fl-pick-card'
                }
              >
                <img src={photo.thumb} alt="" loading="lazy" decoding="async" />
                <div>
                  <span>{sourceLabel(photo.source)}</span>
                  <span>{credit}</span>
                  <button
                    type="button"
                    className="fl-pick-toggle"
                    aria-pressed={photo.prioritized}
                    disabled={busy === key}
                    onClick={() => void toggle(photo)}
                  >
                    {photo.prioritized ? 'Prioritized' : 'Prioritize'}
                  </button>
                  {photo.page ? (
                    <a
                      className="fl-pick-open"
                      href={photo.page}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {more ? <div ref={sentinel} className="fl-pick-more" /> : null}
    </div>
  );
}

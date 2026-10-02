'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../ui';

export type ArchivePhoto = {
  source: string;
  file: string;
  thumb: string;
  page: string | null;
  author: string | null;
  licence: string | null;
  ord: number;
  prioritized: boolean;
  /** Out of the six. The same exclusion as an unmarked nearby photograph. */
  skipped: boolean;
  /** Added on this page. The catalog load does not know it yet, so it can be taken back. */
  added?: boolean;
};

const PAGE = 24;

function sourceLabel(source: string, skipped: boolean): string {
  if (skipped) {
    return 'Skip';
  }
  if (source === 'commons_geosearch') {
    return 'Nearby';
  }
  if (source === 'commons_hand') {
    return 'Added';
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
  const [removing, setRemoving] = useState<ArchivePhoto | null>(null);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [hideSkipped, setHideSkipped] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(initial);
  }, [initial]);

  const marked = photos.filter(p => p.prioritized).length;
  const skipped = photos.filter(p => p.skipped).length;
  const shown = useMemo(
    () =>
      photos.filter(p => {
        if (onlyMarked && !p.prioritized) {
          return false;
        }
        if (hideSkipped && p.skipped) {
          return false;
        }
        return true;
      }),
    [hideSkipped, onlyMarked, photos]
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

  const save = async (
    photo: ArchivePhoto,
    action: 'prioritize_photo' | 'skip_photo',
    next: { prioritized: boolean; skipped: boolean }
  ) => {
    const key = keyOf(photo);
    const prev = { prioritized: photo.prioritized, skipped: photo.skipped };
    setBusy(key);
    setError(null);
    setPhotos(list =>
      list.map(p => (keyOf(p) === key ? { ...p, ...next } : p))
    );
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          place: uuid,
          source: photo.source,
          file: photo.file,
          prioritized: next.prioritized,
          skipped: next.skipped,
        }),
      });
      if (!res.ok) {
        setPhotos(list =>
          list.map(p => (keyOf(p) === key ? { ...p, ...prev } : p))
        );
        setError(`Could not save (${res.status})`);
      }
    } finally {
      setBusy(null);
    }
  };

  const remove = async (photo: ArchivePhoto) => {
    const key = keyOf(photo);
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/fornlamningar/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'remove',
          place: uuid,
          source: photo.source,
          file: photo.file,
        }),
      });
      if (!res.ok) {
        setError(`Could not remove (${res.status})`);
        return;
      }
      setPhotos(list => list.filter(p => keyOf(p) !== key));
      setRemoving(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fl-pick">
      <p className="fl-sub">
        {photos.length} photographs, {marked} prioritized, {skipped} skipped.
        The app still receives six. Skipped photographs stay out. Prioritized
        ones go first.
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
        <button
          type="button"
          className="fl-pick-filter"
          aria-pressed={hideSkipped}
          onClick={() => {
            setHideSkipped(v => !v);
            setVisible(PAGE);
          }}
        >
          {hideSkipped ? 'Show skipped' : 'Hide skipped'}
        </button>
        {more ? (
          <span className="fl-pick-range">
            {slice.length} of {shown.length}
          </span>
        ) : null}
      </div>
      {error ? <p className="fl-empty">{error}</p> : null}
      {slice.length === 0 ? (
        <p className="fl-empty">No photographs in this view.</p>
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
                  photo.skipped
                    ? 'fl-pick-card is-skip'
                    : photo.prioritized
                      ? 'fl-pick-card is-on'
                      : 'fl-pick-card'
                }
              >
                <img src={photo.thumb} alt="" loading="lazy" decoding="async" />
                <div>
                  <span>{sourceLabel(photo.source, photo.skipped)}</span>
                  <span>{credit}</span>
                  <button
                    type="button"
                    className="fl-pick-toggle"
                    aria-pressed={photo.prioritized}
                    disabled={busy === key}
                    onClick={() =>
                      void save(photo, 'prioritize_photo', {
                        prioritized: !photo.prioritized,
                        skipped: photo.prioritized ? photo.skipped : false,
                      })
                    }
                  >
                    {photo.prioritized ? 'Prioritized' : 'Prioritize'}
                  </button>
                  <button
                    type="button"
                    className="fl-pick-toggle is-skip"
                    aria-pressed={photo.skipped}
                    disabled={busy === key}
                    onClick={() =>
                      void save(photo, 'skip_photo', {
                        skipped: !photo.skipped,
                        prioritized: photo.skipped ? photo.prioritized : false,
                      })
                    }
                  >
                    {photo.skipped ? 'Skipped' : 'Skip'}
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
                  {photo.added ? (
                    <button
                      type="button"
                      className="fl-pick-open"
                      disabled={busy === key}
                      onClick={() => setRemoving(photo)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {more ? <div ref={sentinel} className="fl-pick-more" /> : null}
      <ConfirmDialog
        opened={removing !== null}
        title="Remove this photograph?"
        body="It leaves the drawer. If the app is already showing it, skip it too."
        confirmLabel="Remove"
        busy={busy !== null}
        onClose={() => {
          if (!busy) {
            setRemoving(null);
          }
        }}
        onConfirm={() => {
          if (removing) {
            void remove(removing);
          }
        }}
      />
    </div>
  );
}

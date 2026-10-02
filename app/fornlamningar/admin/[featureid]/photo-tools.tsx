'use client';

import React, { useState } from 'react';

/**
 * Add a Commons file by hand, or run the nearby search for this one place.
 * Both write fl_photos_added. The drawer reloads when either succeeds.
 */
export function PhotoTools({
  uuid,
  token,
  onChange,
}: {
  uuid: string;
  token: string;
  onChange: () => void;
}) {
  const [file, setFile] = useState('');
  const [busy, setBusy] = useState<'add' | 'nearby' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const post = async (body: object): Promise<Record<string, unknown> | null> => {
    const res = await fetch('/api/fornlamningar/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
    } & Record<string, unknown>;
    if (!res.ok) {
      setError(json.error ?? `Failed (${res.status})`);
      return null;
    }
    return json;
  };

  const add = async () => {
    setBusy('add');
    setError(null);
    setNote(null);
    try {
      const json = await post({ action: 'add', place: uuid, file });
      if (!json) {
        return;
      }
      setFile('');
      setNote('Added. It shows here now, and the app picks it up on the next pipeline run.');
      onChange();
    } finally {
      setBusy(null);
    }
  };

  const nearby = async () => {
    setBusy('nearby');
    setError(null);
    setNote(null);
    try {
      const json = await post({ action: 'nearby', place: uuid });
      if (!json) {
        return;
      }
      const found = Number(json.found ?? 0);
      const added = Number(json.added ?? 0);
      if (found === 0) {
        setNote('Nothing on Commons within 500 m.');
        return;
      }
      if (added === 0) {
        setNote('Commons has photographs nearby. They were already in the drawer.');
        return;
      }
      setNote(
        added === 1
          ? '1 new photograph. It stays out of the app until you prioritize it.'
          : `${added} new photographs. They stay out of the app until you prioritize one.`
      );
      onChange();
    } finally {
      setBusy(null);
    }
  };

  return (
    <form
      className="fl-card fl-photo-tools"
      onSubmit={e => {
        e.preventDefault();
        if (file.trim() && !busy) {
          void add();
        }
      }}
    >
      <strong>Add a photograph</strong>
      <input
        type="text"
        placeholder="https://commons.wikimedia.org/wiki/File:…  or  File:Name.jpg"
        value={file}
        onChange={e => setFile(e.target.value)}
      />
      <span className="fl-add-hint">
        A Commons file. It is prioritized, so the app ships it on the next
        pipeline run.
      </span>
      <div className="fl-photo-tools-row">
        <button
          type="submit"
          className="fl-add-button"
          disabled={!file.trim() || busy !== null}
        >
          {busy === 'add' ? 'Adding…' : 'Add photograph'}
        </button>
        <button
          type="button"
          className="fl-add-button"
          disabled={busy !== null}
          onClick={() => void nearby()}
        >
          {busy === 'nearby' ? 'Searching…' : 'Search nearby'}
        </button>
      </div>
      <span className="fl-add-hint">
        Search nearby looks on Commons within 500 m of the pin. New files
        land in the drawer and stay out of the app until you prioritize one.
      </span>
      {error ? <span className="fl-add-error">{error}</span> : null}
      {note ? <span className="fl-add-hint">{note}</span> : null}
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import { errorCode, photoStorage } from '../auth';

/**
 * Add a Commons file by hand, paste a photo from the clipboard, or run the
 * nearby search for this one place. All three write fl_photos_added. The
 * drawer reloads when one succeeds.
 */

const LIMIT = 2 * 1024 * 1024;

function clipboardImage(data: DataTransfer | null): File | null {
  if (!data) {
    return null;
  }
  for (const item of data.items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

/** A jpeg the storage rules will accept: that type, under 2 MB. */
async function jpegOf(
  file: Blob
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.82;
    for (let i = 0; i < 6; i++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not read that image');
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(b => resolve(b), 'image/jpeg', quality)
      );
      if (blob && blob.size < LIMIT) {
        return { blob, width, height };
      }
      scale *= 0.72;
      quality = Math.max(0.55, quality - 0.08);
    }
    throw new Error('That image is too large');
  } finally {
    bitmap.close();
  }
}
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
  const [busy, setBusy] = useState<'add' | 'nearby' | 'paste' | null>(null);
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

  const paste = async (image: File) => {
    setBusy('paste');
    setError(null);
    setNote(null);
    try {
      const jpeg = await jpegOf(image);
      const storage = await photoStorage();
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (!uid) {
        setError('Sign in again, then paste the photo.');
        return;
      }
      const id = crypto.randomUUID();
      const { ref, uploadBytes, updateMetadata } = await import(
        'firebase/storage'
      );
      const object = ref(storage, `photos/${id}.jpg`);
      await uploadBytes(object, jpeg.blob, {
        contentType: 'image/jpeg',
        customMetadata: { owner: uid, approved: 'false' },
      });
      await updateMetadata(object, {
        contentType: 'image/jpeg',
        customMetadata: { owner: uid, approved: 'true' },
      });
      const json = await post({
        action: 'paste',
        place: uuid,
        id,
        width: jpeg.width,
        height: jpeg.height,
      });
      if (!json) {
        return;
      }
      setNote(
        'Added. It shows here now, and the app picks it up on the next pipeline run.'
      );
      onChange();
    } catch (e) {
      setError(
        errorCode(e) ??
          (e instanceof Error ? e.message : 'Could not add that photo')
      );
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
      tabIndex={0}
      onPaste={e => {
        const image = clipboardImage(e.clipboardData);
        if (!image || busy) {
          return;
        }
        e.preventDefault();
        void paste(image);
      }}
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
        Paste a photo onto this card, or a Commons link in the box. Either
        one is prioritized, so the app ships it on the next pipeline run.
      </span>
      <div className="fl-photo-tools-row">
        <button
          type="submit"
          className="fl-add-button"
          disabled={!file.trim() || busy !== null}
        >
          {busy === 'add' || busy === 'paste' ? 'Adding…' : 'Add photograph'}
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

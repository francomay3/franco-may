'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Checkbox } from '@mantine/core';
import { AdminGate } from '../gate';
import { ConfirmDialog } from '../ui';

/**
 * Every note that a place needs a fix.
 *
 * Open notes are the list to work through. A corrected one stays, greyed,
 * so "fixed" and "never written" are not the same row. Delete forgets it.
 */

type Flag = {
  id: string;
  place_uuid: string;
  title: string | null;
  note: string;
  created_at: string;
  corrected_at: string | null;
};

function when(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function FlagList({ token }: { token: string }) {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(
    async (all: boolean) => {
      const q = all ? '?all=1' : '';
      const res = await fetch(`/api/fornlamningar/flags${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      const body = (await res.json()) as { flags: Flag[] };
      setFlags(body.flags);
      setError(null);
    },
    [token]
  );

  useEffect(() => {
    void load(showCorrected);
  }, [load, showCorrected]);

  const act = async (payload: object) => {
    setBusy('flag');
    try {
      const res = await fetch('/api/fornlamningar/flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(`could not update the flag: ${res.status}`);
        return;
      }
      setPending(null);
      await load(showCorrected);
    } finally {
      setBusy(null);
    }
  };

  const open = (flags ?? []).filter(flag => !flag.corrected_at).length;

  return (
    <>
      <p className="fl-sub">
        {flags === null
          ? 'Loading…'
          : showCorrected
            ? `${open} open, ${flags.length} in all.`
            : open === 1
              ? '1 open flag.'
              : `${open} open flags.`}
      </p>
      <div className="fl-interest">
        <Checkbox
          label="Show corrected"
          checked={showCorrected}
          onChange={e => setShowCorrected(e.currentTarget.checked)}
        />
      </div>
      {error ? (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      ) : null}
      {flags && flags.length === 0 ? (
        <p className="fl-empty">
          {showCorrected ? 'No flags.' : 'No open flags.'}
        </p>
      ) : (
        <div className="fl-list">
          {(flags ?? []).map(flag => (
            <article
              key={flag.id}
              className={
                flag.corrected_at
                  ? 'fl-card fl-flag is-done'
                  : 'fl-card fl-flag'
              }
            >
              <Link
                className="fl-flag-place"
                href={`/fornlamningar/admin/${flag.place_uuid}`}
              >
                {flag.title ?? flag.place_uuid}
              </Link>
              <p className="fl-flag-note">{flag.note}</p>
              <p className="fl-sub">
                {when(flag.created_at)}
                {flag.corrected_at
                  ? ` · Corrected ${when(flag.corrected_at)}`
                  : ''}
              </p>
              <div className="fl-flag-actions">
                {flag.corrected_at ? null : (
                  <button
                    type="button"
                    disabled={busy === 'flag'}
                    onClick={() => void act({ action: 'correct', id: flag.id })}
                  >
                    Mark corrected
                  </button>
                )}
                <button
                  type="button"
                  className="is-danger"
                  disabled={busy === 'flag'}
                  onClick={() => setPending(flag.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <ConfirmDialog
        opened={pending !== null}
        title="Delete this flag?"
        body="The note is removed. Marking it corrected keeps it, as a record that it was fixed."
        confirmLabel="Delete"
        busy={busy !== null}
        onClose={() => {
          if (!busy) {
            setPending(null);
          }
        }}
        onConfirm={() => {
          if (pending) {
            void act({ action: 'delete', id: pending });
          }
        }}
      />
    </>
  );
}

export function Flags() {
  return (
    <AdminGate title="Flags">{token => <FlagList token={token} />}</AdminGate>
  );
}

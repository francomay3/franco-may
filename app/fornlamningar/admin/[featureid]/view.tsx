'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  Rating,
  Text,
} from '@mantine/core';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  currentToken,
  errorCode,
  photoStorage,
  redirectToken,
  signIn,
  signOut,
} from '../auth';
import { PlaceMap } from '../PlaceMap';
import { ConfirmDialog, IdLink } from '../ui';
import DescriptionText from '../../DescriptionText';
import { ArchivePicker, type ArchivePhoto } from './archive-picker';

/**
 * One place. The id in the path is a register number or the uuid the app
 * uses; the API resolves either. Photos can be removed from here. Comments
 * can be taken down. The description and its image credits are what was
 * published with the place, not something this page edits.
 *
 * "Sources" is every text the pipeline held for the place -- register,
 * Wikipedia, county pages and PDFs, recorded tradition -- from fl_sources.
 * The ones marked "used" went into the prompt. "Photographs" is every
 * picture held for the place. Prioritizing one puts it first when the app
 * next chooses its six. "Not interesting" puts the place on the list the
 * pipeline trains against. "Your rating" is the score under this account,
 * which is the one the app averages. A flag is a note that something
 * about the place is wrong; marking it corrected keeps the note, and
 * deleting it forgets it.
 */

type SourceText = {
  source_id: number;
  /** Set when a person added it here; the id to take it back with. */
  added_id: number | null;
  kind: string;
  lang: string | null;
  title: string | null;
  body: string;
  author: string | null;
  publisher: string | null;
  licence: string | null;
  url: string | null;
  trust: number | null;
  used: boolean;
  fetched_at: string | null;
};

type Place = {
  query: string;
  uuid: string | null;
  title: string | null;
  content: string | null;
  fornsok: string | null;
  lon: number | null;
  lat: number | null;
  /** The algorithm's point. Present when the map knows this place. */
  calculated: { lon: number; lat: number } | null;
  /** Set when a person dragged the pin. The app uses this after the pipeline. */
  pin_override: { lon: number; lat: number } | null;
  texts: SourceText[];
  sources: {
    file: string;
    by: string | null;
    lic: string | null;
    page: string | null;
  }[];
  archive: ArchivePhoto[];
  comments: {
    event_id: string;
    author: string | null;
    body: string;
    created_at: string;
    removed_at: string | null;
  }[];
  photos: {
    event_id: string;
    status: 'pending' | 'published';
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
  /** On the list the pipeline trains against, as not worth the trip. */
  uninteresting: boolean;
  /** When this place was signed off. Null until then. */
  verified_at: string | null;
  /** `mine` is the score under this account. `average` is what the app shows. */
  rating: { mine: number | null; average: number | null; votes: number };
  /** Notes that something here is wrong. `corrected_at` means it was fixed. */
  flags: {
    id: string;
    note: string;
    created_at: string;
    corrected_at: string | null;
  }[];
};

type Pending =
  | { kind: 'comment'; id: string }
  | { kind: 'photo'; id: string }
  | { kind: 'flag'; id: string }
  | null;

function confirmCopy(pending: Pending): {
  title: string;
  body: string;
  label: string;
} {
  if (pending?.kind === 'photo') {
    return {
      title: 'Delete this photo?',
      body: 'It is removed from the place and from the phone that uploaded it. The file in storage goes too.',
      label: 'Delete',
    };
  }
  if (pending?.kind === 'flag') {
    return {
      title: 'Delete this flag?',
      body: 'The note is removed. Marking it corrected keeps it, as a record that it was fixed.',
      label: 'Delete',
    };
  }
  return {
    title: 'Take this comment down?',
    body: 'Visitors stop seeing it, including on the phone that wrote it. It stays on this page, marked hidden.',
    label: 'Take down',
  };
}

function flagWhen(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function ratingLine(rating: Place['rating'] | undefined): string {
  if (!rating || rating.average == null || rating.votes === 0) {
    return 'Yours is the rating the app will show.';
  }
  const avg = rating.average.toFixed(1);
  const n = rating.votes === 1 ? '1 rating' : `${rating.votes} ratings`;
  return `The app shows ${avg} from ${n}.`;
}

function commonsThumb(file: string): string {
  let name = file;
  try {
    name = decodeURIComponent(file);
  } catch {
    name = file;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=640`;
}

export default function PlaceAdminPage() {
  const params = useParams<{ featureid: string }>();
  const id = decodeURIComponent(params.featureid ?? '');
  const [token, setToken] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [flagNote, setFlagNote] = useState('');

  const load = useCallback(
    async (t: string) => {
      const res = await fetch(
        `/api/fornlamningar/place?id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      setPlace((await res.json()) as Place);
      setError(null);
    },
    [id]
  );

  useEffect(() => {
    void (async () => {
      try {
        const t = (await redirectToken()) ?? (await currentToken());
        setToken(t);
        if (t) {
          await load(t);
        }
      } catch (e) {
        setError(errorCode(e) ?? 'Sign-in failed.');
      }
    })();
  }, [load]);

  const hide = async (eventId: string) => {
    if (!token) {
      return;
    }
    setBusy(eventId);
    try {
      const res = await fetch('/api/fornlamningar/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'hide', event_id: eventId }),
      });
      if (!res.ok) {
        setError(`hide failed: ${res.status}`);
        return;
      }
      setPending(null);
      await load(token);
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async (eventId: string) => {
    if (!token) {
      return;
    }
    setBusy(eventId);
    try {
      const { ref, deleteObject } = await import('firebase/storage');
      const object = ref(await photoStorage(), `photos/${eventId}.jpg`);
      await deleteObject(object).catch(() => undefined);
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'delete_photo', event_id: eventId }),
      });
      if (!res.ok) {
        setError(`delete failed: ${res.status}`);
        return;
      }
      setPending(null);
      await load(token);
    } finally {
      setBusy(null);
    }
  };

  const setStars = async (stars: number) => {
    if (!token || !place?.uuid || stars < 1 || stars > 5) {
      return;
    }
    if (place.rating.mine === stars) {
      return;
    }
    setBusy('rating');
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'rate',
          place: place.uuid,
          stars,
        }),
      });
      if (!res.ok) {
        setError(`could not update: ${res.status}`);
        return;
      }
      const body = (await res.json()) as Place['rating'];
      setPlace(current =>
        current
          ? {
              ...current,
              rating: {
                mine: body.mine,
                average: body.average,
                votes: body.votes,
              },
            }
          : current
      );
    } finally {
      setBusy(null);
    }
  };

  const markUninteresting = async (on: boolean) => {
    if (!token || !place?.uuid) {
      return;
    }
    setBusy('interest');
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'uninteresting',
          place: place.uuid,
          uninteresting: on,
        }),
      });
      if (!res.ok) {
        setError(`could not update: ${res.status}`);
        return;
      }
      setPlace(current =>
        current ? { ...current, uninteresting: on } : current
      );
    } finally {
      setBusy(null);
    }
  };

  const flagCall = async (payload: {
    action: 'add' | 'correct' | 'delete';
    id?: string;
    place?: string;
    note?: string;
  }) => {
    if (!token || !place?.uuid) {
      return;
    }
    setBusy(`flag:${payload.action}`);
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
      if (payload.action === 'add') {
        setFlagNote('');
      }
      await load(token);
    } finally {
      setBusy(null);
    }
  };

  const movePin = async (lon: number, lat: number) => {
    if (!token || !place?.uuid) {
      return;
    }
    const prevLon = place.lon;
    const prevLat = place.lat;
    const prevOverride = place.pin_override;
    setPlace(current => (current ? { ...current, lon, lat } : current));
    setBusy('pin');
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'set_pin',
          place: place.uuid,
          lon,
          lat,
        }),
      });
      if (!res.ok) {
        setError(`could not move the pin: ${res.status}`);
        setPlace(current =>
          current
            ? {
                ...current,
                lon: prevLon,
                lat: prevLat,
                pin_override: prevOverride,
              }
            : current
        );
        return;
      }
      const body = (await res.json()) as {
        lon: number;
        lat: number;
        pin_override: Place['pin_override'];
      };
      setPlace(current =>
        current
          ? {
              ...current,
              lon: body.lon,
              lat: body.lat,
              pin_override: body.pin_override,
            }
          : current
      );
    } finally {
      setBusy(null);
    }
  };

  const clearPin = async () => {
    if (!token || !place?.uuid) {
      return;
    }
    setBusy('pin');
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'clear_pin',
          place: place.uuid,
        }),
      });
      if (!res.ok) {
        setError(`could not reset the pin: ${res.status}`);
        return;
      }
      const body = (await res.json()) as {
        lon: number | null;
        lat: number | null;
      };
      setPlace(current =>
        current
          ? {
              ...current,
              lon: body.lon,
              lat: body.lat,
              pin_override: null,
            }
          : current
      );
    } finally {
      setBusy(null);
    }
  };

  const markVerified = async (on: boolean) => {
    if (!token || !place?.uuid) {
      return;
    }
    setBusy('verified');
    try {
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: on ? 'verify' : 'clear_verified',
          place: place.uuid,
        }),
      });
      if (!res.ok) {
        setError(`could not update: ${res.status}`);
        return;
      }
      const body = (await res.json()) as { verified_at: string | null };
      setPlace(current =>
        current ? { ...current, verified_at: body.verified_at } : current
      );
    } finally {
      setBusy(null);
    }
  };

  const sourceCall = async (payload: object): Promise<string | null> => {
    if (!token) {
      return 'Not signed in';
    }
    const res = await fetch('/api/fornlamningar/sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return body.error ?? `failed: ${res.status}`;
    }
    await load(token);
    return null;
  };

  if (!token && !error) {
    return (
      <Group>
        <Loader size="sm" />
        <Text>Checking…</Text>
      </Group>
    );
  }

  if (!token) {
    return (
      <div>
        <p className="fl-kicker">Place</p>
        <h1 className="fl-title">Sign in</h1>
        {error ? (
          <Alert color="red" mt="md">
            {error}
          </Alert>
        ) : null}
        <Button mt="md" radius="xl" color="dark" onClick={() => void signIn()}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (!place) {
    return error ? (
      <Alert color="red">{error}</Alert>
    ) : (
      <Group>
        <Loader size="sm" />
        <Text>Loading…</Text>
      </Group>
    );
  }

  const confirming = pending !== null;

  return (
    <div>
      <Link href="/fornlamningar/admin" className="fl-back">
        <IconArrowLeft size={16} />
        Admin
      </Link>
      <header className="fl-top">
        <div>
          <p className="fl-kicker">Place</p>
          <h1 className="fl-title">{place.title ?? id}</h1>
          <p className="fl-sub">
            {id}
            {place.uuid && place.uuid !== id ? ` · ${place.uuid}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="fl-quiet"
          onClick={() => void signOut().then(() => setToken(null))}
        >
          Sign out
        </button>
      </header>

      {!place.uuid ? (
        <Alert color="yellow">No place with that id.</Alert>
      ) : (
        <>
          <div className="fl-links">
            {place.fornsok ? (
              <a href={place.fornsok} target="_blank" rel="noreferrer">
                Fornsök
              </a>
            ) : null}
            {place.lat != null && place.lon != null ? (
              <a
                href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                Google Maps
              </a>
            ) : null}
          </div>

          <div className="fl-rating">
            <span className="fl-rating-label">Your rating</span>
            <Rating
              value={place.rating?.mine ?? 0}
              count={5}
              color="yellow"
              readOnly={busy === 'rating'}
              onChange={value => void setStars(value)}
            />
            <p className="fl-sub">{ratingLine(place.rating)}</p>
          </div>

          <div className="fl-interest">
            <Checkbox
              label="Not interesting"
              checked={place.uninteresting}
              disabled={busy === 'interest'}
              onChange={e => void markUninteresting(e.currentTarget.checked)}
            />
            <p className="fl-sub">
              {place.uninteresting
                ? 'On the list the pipeline trains against.'
                : 'Puts this place on the list of sites that are not worth the trip.'}
            </p>
          </div>

          <div className="fl-verified">
            <button
              type="button"
              className="fl-add-button"
              disabled={busy === 'verified'}
              onClick={() => void markVerified(true)}
            >
              {place.verified_at ? 'Verify again' : 'Mark verified'}
            </button>
            <p className="fl-sub">
              {place.verified_at
                ? `Verified ${flagWhen(place.verified_at)}.`
                : 'Stamps this moment, once the photos, sources and rating are in order.'}
            </p>
            {place.verified_at ? (
              <button
                type="button"
                className="fl-quiet"
                disabled={busy === 'verified'}
                onClick={() => void markVerified(false)}
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="fl-flags">
            <h2>Flags</h2>
            <p className="fl-sub">
              A note on what is wrong with this place. Open notes are the list
              to work through.
            </p>
            {place.flags.map(flag => (
              <article
                key={flag.id}
                className={
                  flag.corrected_at
                    ? 'fl-card fl-flag is-done'
                    : 'fl-card fl-flag'
                }
              >
                <p className="fl-flag-note">{flag.note}</p>
                <p className="fl-sub">
                  {flagWhen(flag.created_at)}
                  {flag.corrected_at
                    ? ` · Corrected ${flagWhen(flag.corrected_at)}`
                    : ''}
                </p>
                <div className="fl-flag-actions">
                  {flag.corrected_at ? null : (
                    <button
                      type="button"
                      disabled={busy?.startsWith('flag:') === true}
                      onClick={() =>
                        void flagCall({ action: 'correct', id: flag.id })
                      }
                    >
                      Mark corrected
                    </button>
                  )}
                  <button
                    type="button"
                    className="is-danger"
                    disabled={busy?.startsWith('flag:') === true}
                    onClick={() => setPending({ kind: 'flag', id: flag.id })}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            <form
              className="fl-flag-form"
              onSubmit={e => {
                e.preventDefault();
                const uuid = place.uuid;
                if (
                  flagNote.trim() &&
                  uuid &&
                  busy?.startsWith('flag:') !== true
                ) {
                  void flagCall({
                    action: 'add',
                    place: uuid,
                    note: flagNote.trim(),
                  });
                }
              }}
            >
              <textarea
                placeholder="This place is in the wrong category"
                rows={3}
                maxLength={2000}
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
              />
              <button
                type="submit"
                className="fl-add-button"
                disabled={
                  !flagNote.trim() || busy?.startsWith('flag:') === true
                }
              >
                {busy === 'flag:add' ? 'Saving…' : 'Flag'}
              </button>
            </form>
          </div>

          {place.lat != null && place.lon != null ? (
            <>
              <PlaceMap
                lon={place.lon}
                lat={place.lat}
                draggable={busy !== 'pin'}
                onMove={(lon, lat) => void movePin(lon, lat)}
              />
              <div className="fl-pin">
                <p className="fl-sub">
                  {place.pin_override
                    ? 'Forced position. After the next pipeline run the app stands here.'
                    : 'Drag the pin to where it should stand. After the next pipeline run the app uses it.'}
                </p>
                {place.pin_override ? (
                  <button
                    type="button"
                    className="fl-quiet"
                    disabled={busy === 'pin'}
                    onClick={() => void clearPin()}
                  >
                    Reset pin
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="fl-empty">No coordinate for this place.</p>
          )}

          {place.content ? (
            <DescriptionText className="fl-prose" content={place.content} />
          ) : (
            <p className="fl-empty">No description published for this place.</p>
          )}

          <div className="fl-section">
            <h2>Sources</h2>
          </div>
          {place.texts.length === 0 ? (
            <p className="fl-empty">
              No source text for this place in the published release.
            </p>
          ) : (
            <div className="fl-list">
              {place.texts.map(s => (
                <SourceCard
                  key={s.source_id}
                  source={s}
                  onRemove={
                    s.added_id
                      ? () =>
                          void sourceCall({ action: 'remove', id: s.added_id })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
          <AddSource
            onAdd={fields =>
              sourceCall({ action: 'add', place: place.uuid ?? id, ...fields })
            }
          />

          <div className="fl-section">
            <h2>Photographs</h2>
          </div>
          {(place.archive ?? []).length > 0 && place.uuid ? (
            <ArchivePicker
              uuid={place.uuid}
              token={token}
              photos={place.archive}
            />
          ) : place.sources.length === 0 ? (
            <p className="fl-empty">No photograph held for this place.</p>
          ) : (
            <div className="fl-sources">
              {place.sources.map(s => {
                const card = (
                  <>
                    {s.file ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={commonsThumb(s.file)} alt="" />
                    ) : null}
                    <div>
                      <strong>{s.file || 'Photograph'}</strong>
                      <span>
                        {[s.by, s.lic].filter(Boolean).join(' · ') ||
                          'No credit'}
                      </span>
                    </div>
                  </>
                );
                return s.page ? (
                  <a
                    key={s.file}
                    className="fl-source"
                    href={s.page}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={s.file} className="fl-source">
                    {card}
                  </div>
                );
              })}
            </div>
          )}

          <div className="fl-section">
            <h2>Visitor photos</h2>
          </div>
          {place.photos.length === 0 ? (
            <p className="fl-empty">No visitor photos.</p>
          ) : (
            <div className="fl-photos">
              {place.photos.map(p => (
                <PhotoRow
                  key={p.event_id}
                  photo={p}
                  busy={busy === p.event_id}
                  onDelete={() => setPending({ kind: 'photo', id: p.event_id })}
                />
              ))}
            </div>
          )}

          <div className="fl-section">
            <h2>Comments</h2>
          </div>
          {place.comments.length === 0 ? (
            <p className="fl-empty">No comments.</p>
          ) : (
            <div className="fl-list">
              {place.comments.map(c => (
                <article
                  key={c.event_id}
                  className={`fl-card fl-comment${c.removed_at ? ' is-hidden' : ''}`}
                >
                  <div className="fl-comment-main">
                    <p className="fl-body">{c.body}</p>
                    <div className="fl-meta">
                      <span>
                        {new Date(c.created_at).toLocaleString('sv-SE')}
                      </span>
                      {c.author ? (
                        <IdLink
                          kind="User"
                          id={c.author}
                          href={`/fornlamningar/admin/user/${c.author}`}
                        />
                      ) : (
                        <span>User unknown</span>
                      )}
                      <span className="fl-actions">
                        {c.removed_at ? (
                          <span className="fl-pill">Hidden</span>
                        ) : (
                          <button
                            type="button"
                            className="fl-icon"
                            aria-label="Take this comment down"
                            disabled={busy === c.event_id}
                            onClick={() =>
                              setPending({ kind: 'comment', id: c.event_id })
                            }
                          >
                            <IconTrash size={18} />
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {error ? (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      ) : null}

      <ConfirmDialog
        opened={confirming}
        title={confirmCopy(pending).title}
        body={confirmCopy(pending).body}
        confirmLabel={confirmCopy(pending).label}
        busy={busy !== null}
        onClose={() => {
          if (!busy) {
            setPending(null);
          }
        }}
        onConfirm={() => {
          if (!pending) {
            return;
          }
          if (pending.kind === 'photo') {
            void removePhoto(pending.id);
          } else if (pending.kind === 'flag') {
            void flagCall({ action: 'delete', id: pending.id });
          } else {
            void hide(pending.id);
          }
        }}
      />
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  register: 'Register',
  register_parts: 'Register, parts',
  register_vegetation: 'Register, vegetation',
  tradition: 'Tradition',
  wikipedia: 'Wikipedia',
  user_comment: 'Visitor comment',
  county_attr: 'County, attribute',
  county_page: 'County web page',
  county_programme: 'County programme',
  county_plan: 'County plan',
  county_pdf: 'County PDF',
  web: 'Web page',
  web_page: 'Web page',
};

/**
 * Collapsed past a few lines: a register text can run to pages, and the
 * point of the list is to see at a glance what the model had.
 */
function SourceCard({
  source: s,
  onRemove,
}: {
  source: SourceText;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const long = s.body.length > 420;
  const credit = [s.publisher, s.author, s.licence, s.lang]
    .filter(Boolean)
    .join(' · ');
  return (
    <article className="fl-card fl-text">
      <div className="fl-text-head">
        <span className="fl-pill">{KIND_LABEL[s.kind] ?? s.kind}</span>
        {s.used ? <span className="fl-pill is-ok">Used</span> : null}
        {s.added_id ? <span className="fl-pill">Added by hand</span> : null}
        {s.title ? <strong>{s.title}</strong> : null}
      </div>
      <p className={`fl-text-body${long && !open ? ' is-clipped' : ''}`}>
        {s.body}
      </p>
      <div className="fl-text-foot">
        <span>
          {credit}
          {` · ${s.body.length.toLocaleString()} chars`}
        </span>
        {long ? (
          <button
            type="button"
            className="fl-quiet"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Less' : 'More'}
          </button>
        ) : null}
        {s.url ? (
          <a href={s.url} target="_blank" rel="noreferrer">
            Open
          </a>
        ) : null}
        {onRemove ? (
          <button type="button" className="fl-quiet" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}

const WIKI_URL = /^https?:\/\/[a-z-]+\.(m\.)?wikipedia\.org\/wiki\//i;

/**
 * A Wikipedia link is enough: the server fetches the whole article. Any
 * other page needs its text pasted, so the box for it only opens when the
 * link is not Wikipedia -- asking for text the server is about to fetch
 * would be asking for a copy nobody should have to make.
 */
function AddSource({
  onAdd,
}: {
  onAdd: (f: {
    url?: string;
    title?: string;
    body?: string;
  }) => Promise<string | null>;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wiki = WIKI_URL.test(url.trim());
  const ready = wiki || body.trim().length >= 40;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = await onAdd({
      url: url.trim() || undefined,
      title: wiki ? undefined : title.trim() || undefined,
      body: wiki ? undefined : body.trim() || undefined,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setUrl('');
    setTitle('');
    setBody('');
  };

  return (
    <form
      className="fl-card fl-add-source"
      onSubmit={e => {
        e.preventDefault();
        if (ready && !busy) {
          void submit();
        }
      }}
    >
      <strong>Add a source</strong>
      <input
        type="url"
        placeholder="https://sv.wikipedia.org/wiki/…  or any page"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      {!wiki ? (
        <>
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Paste the text of the page. Only Wikipedia links are fetched for you."
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </>
      ) : (
        <span className="fl-add-hint">
          The whole article is fetched when you add it.
        </span>
      )}
      {error ? <span className="fl-add-error">{error}</span> : null}
      <button type="submit" className="fl-add-button" disabled={!ready || busy}>
        {busy ? 'Adding…' : 'Add source'}
      </button>
    </form>
  );
}

function PhotoRow({
  photo,
  busy,
  onDelete,
}: {
  photo: Place['photos'][number];
  busy: boolean;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const { ref, getBytes } = await import('firebase/storage');
        const object = ref(
          await photoStorage(),
          `photos/${photo.event_id}.jpg`
        );
        const bytes = await getBytes(object);
        if (dead) {
          return;
        }
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: 'image/jpeg' })
        );
        setUrl(objectUrl);
      } catch {
        if (!dead) {
          setUrl(null);
        }
      }
    })();
    return () => {
      dead = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo.event_id]);

  return (
    <article className="fl-photo">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <div className="fl-photo-missing">No file</div>
      )}
      <footer>
        <div>
          <span
            className={`fl-pill${photo.status === 'published' ? ' is-ok' : ''}`}
          >
            {photo.status}
          </span>
          <div className="fl-count">
            {new Date(photo.created_at).toLocaleString('sv-SE')}
          </div>
        </div>
        <button
          type="button"
          className="fl-icon"
          aria-label="Delete photo"
          disabled={busy}
          onClick={onDelete}
        >
          <IconTrash size={18} />
        </button>
      </footer>
    </article>
  );
}

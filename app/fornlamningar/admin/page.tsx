'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Checkbox,
  Code,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import {
  currentToken,
  errorCode,
  photoStorage,
  redirectToken,
  signIn,
  signOut,
} from './auth';
import { ConfirmDialog, IdLink } from './ui';

/**
 * Moderation: read what was published, hide what should not have been.
 *
 * THE NORMAL OUTCOME OF OPENING THIS PAGE IS DOING NOTHING. Comments publish
 * immediately -- EU hosting law asks that you be reachable and act on a
 * notice, not that you read everything first -- so this is a feed to skim,
 * not a queue to clear. There is no "approve".
 *
 * Accept means "I have seen this, leave it published, and stop showing it
 * here." A later report brings that comment back. Hide is the one that
 * takes it down.
 *
 * A hidden comment STAYS IN THE LIST, greyed. A moderation log where
 * decisions disappear cannot tell "nobody has looked at this" from "somebody
 * looked and allowed it", which is the only question the page exists to
 * answer.
 *
 * The token is fetched per request rather than held in state: Firebase ID
 * tokens expire in an hour and the SDK refreshes them silently, so asking is
 * both shorter and more correct than caching.
 */

type Comment = {
  seq: number;
  event_id: string;
  place_uuid: string;
  author: string | null;
  body: string;
  created_at: string;
  removed_at: string | null;
  reports: number;
  reasons: string | null;
  notes: string | null;
};

type PendingPhoto = {
  event_id: string;
  place_uuid: string;
  width: number | null;
  height: number | null;
  created_at: string;
};

type Feed = {
  comments: Comment[];
  /** Comments still in the feed, including the ones past this page. */
  waiting?: number;
  photos: { accepted: boolean; pending: PendingPhoto[] };
};

type State =
  | { at: 'loading' }
  | { at: 'anon'; signinError?: string }
  | { at: 'not-listed'; uid: string }
  | { at: 'error'; message: string }
  | { at: 'ready'; feed: Feed };

/**
 * What a Firebase sign-in error actually means, for the two that happen.
 *
 * WHY THIS EXISTS AT ALL: the first version of this page swallowed sign-in
 * errors -- `void signIn().then(load)` with no catch -- so a failed sign-in
 * left the button sitting there and said nothing. The popup opened, Google
 * signed you in, the window closed, and the page had not changed. That is a
 * worse bug than whatever it was hiding, because it makes the real cause
 * unreachable without opening the browser console.
 */
function explain(code: string | null): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return (
        "This site is not in the Firebase project's Authorized domains. " +
        'Firebase console -> Authentication -> Settings -> Authorized ' +
        "domains, and add this page's host. The popup opens and then " +
        'bounces: the handler rejects the origin, not the account.'
      );
    case 'auth/operation-not-allowed':
      return (
        'Google sign-in is not enabled for this Firebase project. ' +
        'Console -> Authentication -> Sign-in method.'
      );
    case 'auth/popup-closed-by-user':
      return 'The sign-in window was closed before it finished.';
    default:
      return code ?? 'Sign-in failed.';
  }
}

export default function ModerationPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ at: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [placeQuery, setPlaceQuery] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState<string | null>(null);

  const load = useCallback(async (token: string | null) => {
    if (!token) {
      setState({ at: 'anon' });
      return;
    }
    try {
      const res = await fetch('/api/fornlamningar/moderate', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        // The bootstrap: a real Google account that is not on the list yet.
        // The server hands back the uid so it can be pasted into the
        // variable, which is the only way to fill a list that gates its own
        // first use.
        const body = await res.json();
        setState({ at: 'not-listed', uid: String(body.uid ?? '') });
        return;
      }
      if (!res.ok) {
        // 404 included, which is what a stranger gets. Shown as-is rather
        // than explained, because explaining it is the reconnaissance the
        // 404 exists to avoid.
        setState({ at: 'error', message: `${res.status}` });
        return;
      }
      setState({ at: 'ready', feed: (await res.json()) as Feed });
    } catch (e) {
      setState({
        at: 'error',
        message: e instanceof Error ? e.message : 'failed',
      });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        // The redirect result FIRST: it is what completes a sign-in that went
        // the long way round, and asking for the current user before it can
        // answer null for somebody halfway through one.
        const token = (await redirectToken()) ?? (await currentToken());
        await load(token);
      } catch (e) {
        setState({ at: 'anon', signinError: explain(errorCode(e)) });
      }
    })();
  }, [load]);

  const act = useCallback(
    async (eventId: string, action: 'hide' | 'keep' | 'approve' | 'reject') => {
      setBusy(eventId);
      try {
        const token = await currentToken();
        const res = await fetch('/api/fornlamningar/moderate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, event_id: eventId }),
        });
        if (!res.ok) {
          setState({ at: 'error', message: `${action} failed: ${res.status}` });
          return;
        }
        // Re-read rather than patch the row in place. The server decides what
        // a removal looks like -- including that hiding twice is one
        // removal -- and a local guess at the new state is a second answer
        // that can be wrong.
        await load(token);
        setPicked(new Set());
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

  const acceptPicked = useCallback(async () => {
    const ids = [...picked];
    if (!ids.length) return;
    setBusy('accept');
    try {
      const token = await currentToken();
      const res = await fetch('/api/fornlamningar/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'accept', event_ids: ids }),
      });
      if (!res.ok) {
        setState({ at: 'error', message: `accept failed: ${res.status}` });
        return;
      }
      const body = (await res.json()) as { accepted?: number };
      setNote(
        `Accepted ${body.accepted ?? ids.length}. They stay published and leave this list.`
      );
      setPicked(new Set());
      await load(token);
    } finally {
      setBusy(null);
    }
  }, [picked, load]);

  const openPlace = () => {
    const q = placeQuery.trim();
    if (!q) return;
    router.push(`/fornlamningar/admin/${encodeURIComponent(q)}`);
  };

  if (state.at === 'loading') {
    return (
      <Group>
        <Loader size="sm" />
        <Text>Checking…</Text>
      </Group>
    );
  }

  if (state.at === 'anon') {
    const start = async () => {
      setState({ at: 'loading' });
      try {
        const token = await signIn();
        // null means a redirect is under way: the page is about to be
        // replaced, so there is nothing to do but leave the spinner up.
        if (token !== null) {
          await load(token);
        }
      } catch (e) {
        setState({ at: 'anon', signinError: explain(errorCode(e)) });
      }
    };
    return (
      <Stack align="flex-start">
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">Moderation</h1>
        {state.signinError ? (
          <Alert color="red" title="Sign-in failed" maw={640}>
            {state.signinError}
          </Alert>
        ) : null}
        <Button mt="md" radius="xl" color="dark" onClick={() => void start()}>
          Sign in with Google
        </Button>
      </Stack>
    );
  }

  if (state.at === 'not-listed') {
    return (
      <Stack align="flex-start">
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">Moderation</h1>
        <Alert title="Signed in, but not a moderator" color="yellow">
          <Text size="sm">
            Add this uid to <Code>FL_ADMIN_UIDS</Code> in the project&apos;s
            environment variables, redeploy, and reload.
          </Text>
          <Code block mt="sm">
            {state.uid}
          </Code>
        </Alert>
        <Button
          variant="subtle"
          onClick={() => void signOut().then(() => load(null))}
        >
          Sign out
        </Button>
      </Stack>
    );
  }

  if (state.at === 'error') {
    return (
      <Stack align="flex-start">
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">Moderation</h1>
        <Alert color="red" title="Could not load">
          {state.message}
        </Alert>
        <Button
          variant="subtle"
          onClick={() => void signOut().then(() => load(null))}
        >
          Sign out
        </Button>
      </Stack>
    );
  }

  const { comments, photos } = state.feed;

  return (
    <div>
      <header className="fl-top">
        <div>
          <p className="fl-kicker">Fornkoll</p>
          <h1 className="fl-title">Moderation</h1>
        </div>
        <button
          type="button"
          className="fl-quiet"
          onClick={() => void signOut().then(() => load(null))}
        >
          Sign out
        </button>
      </header>

      <form
        className="fl-search"
        onSubmit={e => {
          e.preventDefault();
          openPlace();
        }}
      >
        <input
          aria-label="Place"
          placeholder="Open a place, L1997:4707"
          value={placeQuery}
          onChange={e => setPlaceQuery(e.currentTarget.value)}
        />
        <Button type="submit" radius="xl" color="dark" size="sm">
          Open
        </Button>
      </form>

      <div className="fl-section">
        <div>
          <h2>Comments</h2>
          <p className="fl-count">
            {comments.length} shown
            {typeof state.feed.waiting === 'number'
              ? ` · ${state.feed.waiting} waiting`
              : ''}
          </p>
        </div>
        <Group gap="sm">
          {comments.length > 0 ? (
            <Checkbox
              label="All"
              checked={
                comments.length > 0 &&
                comments.every(c => picked.has(c.event_id))
              }
              onChange={e => {
                const on = e.currentTarget.checked;
                setPicked(
                  on ? new Set(comments.map(c => c.event_id)) : new Set()
                );
              }}
            />
          ) : null}
          <Button
            radius="xl"
            color="dark"
            size="sm"
            disabled={picked.size === 0}
            loading={busy === 'accept'}
            onClick={() => void acceptPicked()}
          >
            Accept
          </Button>
        </Group>
      </div>
      {note ? <p className="fl-note">{note}</p> : null}
      {comments.length === 0 ? (
        <p className="fl-empty">
          Nothing waiting. Accepted comments stay published and leave this list.
          A report brings one back.
        </p>
      ) : (
        <div className="fl-list">
          {comments.map(c => (
            <article
              key={c.event_id}
              className={`fl-card fl-comment${c.removed_at ? ' is-hidden' : ''}`}
            >
              <Checkbox
                mt={4}
                checked={picked.has(c.event_id)}
                onChange={e => {
                  const on = e.currentTarget.checked;
                  setPicked(prev => {
                    const next = new Set(prev);
                    if (on) next.add(c.event_id);
                    else next.delete(c.event_id);
                    return next;
                  });
                }}
                aria-label="Select comment"
              />
              <div className="fl-comment-main">
                {c.reports > 0 ? (
                  <p className="fl-report">
                    {c.reports} report{c.reports === 1 ? '' : 's'}: {c.reasons}
                    {c.notes ? ` — ${c.notes}` : ''}
                  </p>
                ) : null}
                <p className="fl-body">{c.body}</p>
                <div className="fl-meta">
                  <span>{new Date(c.created_at).toLocaleString('sv-SE')}</span>
                  {c.author ? (
                    <IdLink
                      kind="User"
                      id={c.author}
                      href={`/fornlamningar/admin/user/${c.author}`}
                    />
                  ) : (
                    <span>User unknown</span>
                  )}
                  <IdLink
                    kind="Place"
                    id={c.place_uuid}
                    href={`/fornlamningar/admin/${encodeURIComponent(c.place_uuid)}`}
                  />
                  <span className="fl-actions">
                    {c.removed_at ? (
                      <span className="fl-pill">Hidden</span>
                    ) : (
                      <>
                        {c.reports > 0 ? (
                          <Button
                            size="xs"
                            variant="subtle"
                            radius="xl"
                            loading={busy === c.event_id}
                            onClick={() => void act(c.event_id, 'keep')}
                          >
                            Keep
                          </Button>
                        ) : null}
                        <button
                          type="button"
                          className="fl-icon"
                          aria-label="Take this comment down"
                          disabled={busy === c.event_id}
                          onClick={() => setConfirmHide(c.event_id)}
                        >
                          <IconTrash size={18} />
                        </button>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="fl-section">
        <h2>Photos</h2>
      </div>
      {photos.pending.length === 0 ? (
        <p className="fl-empty">
          Nothing waiting. A photo stays here until you approve it, and nobody
          else can see the file before that.
        </p>
      ) : (
        <div className="fl-photos">
          {photos.pending.map(p => (
            <PendingPhotoCard
              key={p.event_id}
              photo={p}
              busy={busy === p.event_id}
              onApprove={() => act(p.event_id, 'approve')}
              onReject={() => act(p.event_id, 'reject')}
              onOpen={() =>
                router.push(
                  `/fornlamningar/admin/${encodeURIComponent(p.place_uuid)}`
                )
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        opened={confirmHide !== null}
        title="Take this comment down?"
        body="Visitors stop seeing it, including on the phone that wrote it. It stays on the place page, marked hidden."
        confirmLabel="Take down"
        busy={busy !== null && busy === confirmHide}
        onClose={() => {
          if (busy !== confirmHide) setConfirmHide(null);
        }}
        onConfirm={() => {
          if (!confirmHide) return;
          void act(confirmHide, 'hide').then(() => setConfirmHide(null));
        }}
      />
    </div>
  );
}

const PHOTO_PATH = (id: string) => `photos/${id}.jpg`;

function PendingPhotoCard({
  photo,
  busy,
  onApprove,
  onReject,
  onOpen,
}: {
  photo: PendingPhoto;
  busy: boolean;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [working, setWorking] = useState<'approve' | 'reject' | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    let dead = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const { ref, getBytes } = await import('firebase/storage');
        const object = ref(await photoStorage(), PHOTO_PATH(photo.event_id));
        // getBytes is a browser request to the bucket. The rules already
        // allow this admin to read; what fails without storage.cors.json
        // applied to the bucket is the browser, which drops the 200
        // because the response has no Access-Control-Allow-Origin.
        // Nothing in the environment supplies that header.
        const bytes = await getBytes(object);
        if (dead) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: 'image/jpeg' })
        );
        setUrl(objectUrl);
      } catch {
        if (!dead) setMissing(true);
      }
    })();
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.event_id]);

  const approve = async () => {
    setWorking('approve');
    try {
      const { ref, getMetadata, updateMetadata } = await import(
        'firebase/storage'
      );
      const object = ref(await photoStorage(), PHOTO_PATH(photo.event_id));
      const meta = await getMetadata(object);
      await updateMetadata(object, {
        customMetadata: { ...meta.customMetadata, approved: 'true' },
      });
      await onApprove();
    } finally {
      setWorking(null);
    }
  };

  const reject = async () => {
    setWorking('reject');
    try {
      const { ref, deleteObject } = await import('firebase/storage');
      const object = ref(await photoStorage(), PHOTO_PATH(photo.event_id));
      await deleteObject(object).catch(() => undefined);
      await onReject();
    } finally {
      setWorking(null);
    }
  };

  return (
    <article className="fl-photo">
      {url ? (
        // The bytes came through the admin's own token. A public URL
        // would be a 403, which is the point of the rule.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <div className="fl-photo-missing">
          {missing ? 'File missing' : 'Loading…'}
        </div>
      )}
      <footer>
        <div>
          <button
            type="button"
            className="fl-quiet"
            style={{ padding: 0 }}
            onClick={onOpen}
          >
            Open place
          </button>
          <div className="fl-count">
            {new Date(photo.created_at).toLocaleString('sv-SE')}
          </div>
        </div>
        <Group gap={6}>
          <Button
            size="xs"
            radius="xl"
            color="dark"
            loading={busy || working === 'approve'}
            disabled={missing}
            onClick={() => void approve()}
          >
            Approve
          </Button>
          <button
            type="button"
            className="fl-icon"
            aria-label="Reject photo"
            disabled={busy || working === 'reject'}
            onClick={() => setConfirm(true)}
          >
            <IconTrash size={18} />
          </button>
        </Group>
      </footer>
      <ConfirmDialog
        opened={confirm}
        title="Reject this photo?"
        body="It will not be published. The file is deleted, and the phone that uploaded it drops the photo on the next sync."
        confirmLabel="Reject"
        busy={working === 'reject'}
        onClose={() => {
          if (working !== 'reject') setConfirm(false);
        }}
        onConfirm={() => {
          void reject().finally(() => setConfirm(false));
        }}
      />
    </article>
  );
}

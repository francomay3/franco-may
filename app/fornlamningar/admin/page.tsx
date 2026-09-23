'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  currentToken,
  errorCode,
  photoStorage,
  redirectToken,
  signIn,
  signOut,
} from './auth';

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
        <Title order={2}>Moderation</Title>
        {state.signinError ? (
          <Alert color="red" title="Sign-in failed" maw={640}>
            {state.signinError}
          </Alert>
        ) : null}
        <Button onClick={() => void start()}>Sign in with Google</Button>
      </Stack>
    );
  }

  if (state.at === 'not-listed') {
    return (
      <Stack align="flex-start">
        <Title order={2}>Moderation</Title>
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
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Moderation</Title>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => void signOut().then(() => load(null))}
        >
          Sign out
        </Button>
      </Group>

      <form
        onSubmit={e => {
          e.preventDefault();
          openPlace();
        }}
      >
        <Group align="flex-end" gap="xs">
          <TextInput
            label="Place"
            placeholder="L1997:4707"
            value={placeQuery}
            onChange={e => setPlaceQuery(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 360 }}
          />
          <Button type="submit" variant="light">
            Open
          </Button>
        </Group>
      </form>

      <Group justify="space-between">
        <Title order={4}>Comments</Title>
        <Group gap="sm">
          {comments.length > 0 ? (
            <Checkbox
              label="All"
              checked={
                comments.length > 0 &&
                comments.every(c => picked.has(c.event_id))
              }
              onChange={e => {
                setPicked(
                  e.currentTarget.checked
                    ? new Set(comments.map(c => c.event_id))
                    : new Set()
                );
              }}
            />
          ) : null}
          <Button
            size="xs"
            disabled={picked.size === 0}
            loading={busy === 'accept'}
            onClick={() => void acceptPicked()}
          >
            Accept
          </Button>
        </Group>
      </Group>
      {comments.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nothing waiting. Accepted comments stay published and leave this
          list. A report brings one back.
        </Text>
      ) : (
        <Stack gap="xs">
          {comments.map(c => (
            <Card
              key={c.event_id}
              withBorder
              padding="sm"
              opacity={c.removed_at ? 0.5 : 1}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Checkbox
                  mt={4}
                  checked={picked.has(c.event_id)}
                  onChange={e => {
                    setPicked(prev => {
                      const next = new Set(prev);
                      if (e.currentTarget.checked) next.add(c.event_id);
                      else next.delete(c.event_id);
                      return next;
                    });
                  }}
                  aria-label="Select comment"
                />
                <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                  {c.reports > 0 ? (
                    <Text size="xs" c="red" fw={600}>
                      {c.reports} report{c.reports === 1 ? '' : 's'}:{' '}
                      {c.reasons}
                      {/* The reporters' own words, which are often the only
                          thing that explains why a comment that reads fine is
                          not -- a name, a private detail, something only
                          somebody who knows the place would catch. */}
                      {c.notes ? ` — ${c.notes}` : ''}
                    </Text>
                  ) : null}
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {c.body}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(c.created_at).toLocaleString('sv-SE')} ·{' '}
                    {/* The pseudonym, not the device id: that value is a write
                        credential, and being the moderator does not change
                        what it is. Enough to see that two comments are the
                        same person. */}
                    {c.author?.slice(0, 8) ?? 'unknown'} ·{' '}
                    <Text
                      span
                      size="xs"
                      c="dimmed"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() =>
                        router.push(
                          `/fornlamningar/admin/${encodeURIComponent(c.place_uuid)}`
                        )
                      }
                    >
                      {c.place_uuid}
                    </Text>
                  </Text>
                </Stack>
                {c.removed_at ? (
                  <Badge color="gray" variant="light">
                    hidden
                  </Badge>
                ) : (
                  <Group gap="xs" wrap="nowrap">
                    {/* KEEP IS NOT A NO-OP and it is offered only where it
                        means something: it marks the reports handled without
                        touching the comment. A queue where "this is fine"
                        cannot be expressed pushes you towards removing
                        things, because removing is the only way to make a
                        report go away. */}
                    {c.reports > 0 ? (
                      <Button
                        size="xs"
                        variant="subtle"
                        loading={busy === c.event_id}
                        onClick={() => void act(c.event_id, 'keep')}
                      >
                        Keep
                      </Button>
                    ) : null}
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      loading={busy === c.event_id}
                      onClick={() => void act(c.event_id, 'hide')}
                    >
                      Hide
                    </Button>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Title order={4} mt="md">
        Photos
      </Title>
      {photos.pending.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nothing waiting. A photo stays here until you approve it, and nobody
          else can see the file before that.
        </Text>
      ) : (
        <Stack gap="xs">
          {photos.pending.map(p => (
            <PendingPhotoCard
              key={p.event_id}
              photo={p}
              busy={busy === p.event_id}
              onApprove={() => act(p.event_id, 'approve')}
              onReject={() => act(p.event_id, 'reject')}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

const PHOTO_PATH = (id: string) => `photos/${id}.jpg`;

function PendingPhotoCard({
  photo,
  busy,
  onApprove,
  onReject,
}: {
  photo: PendingPhoto;
  busy: boolean;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [working, setWorking] = useState<'approve' | 'reject' | null>(null);

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
    <Card withBorder padding="sm">
      <Group align="flex-start" wrap="nowrap">
        {url ? (
          // The bytes came through the admin's own token. A public URL
          // would be a 403, which is the point of the rule.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            style={{ width: 120, height: 90, objectFit: 'cover' }}
          />
        ) : (
          <Text size="xs" c="dimmed" w={120}>
            {missing ? 'File missing' : 'Loading…'}
          </Text>
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            {new Date(photo.created_at).toLocaleString('sv-SE')} ·{' '}
            {photo.place_uuid}
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              loading={busy || working === 'approve'}
              disabled={missing}
              onClick={() => void approve()}
            >
              Approve
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={busy || working === 'reject'}
              onClick={() => void reject()}
            >
              Reject
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  currentToken,
  errorCode,
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
 * not a queue to clear. There is no "approve": the only button is Hide.
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

type Feed = {
  comments: Comment[];
  photos: { accepted: boolean; pending: unknown[] };
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
  const [state, setState] = useState<State>({ at: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);

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
    async (eventId: string, action: 'hide' | 'keep') => {
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
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

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

      <Title order={4}>Comments</Title>
      {comments.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nobody has commented yet.
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
                <Stack gap={2} style={{ minWidth: 0 }}>
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
                    {c.author?.slice(0, 8) ?? 'unknown'} · {c.place_uuid}
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
      {/* "Not accepted yet" and "nothing to do" are different facts, and the
          endpoint reports which one this is rather than sending an empty
          list for both. Photos will be PRE-moderated when they exist --
          unlike text, an image carries obligations that a take-it-down-later
          rule does not cover. */}
      <Text c="dimmed" size="sm">
        {photos.accepted
          ? `${photos.pending.length} waiting`
          : 'Not accepted yet. When they are, they will wait here for approval before anybody else sees them.'}
      </Text>
    </Stack>
  );
}

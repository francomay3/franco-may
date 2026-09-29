'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Code, Group, Loader, Stack, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  currentToken,
  errorCode,
  redirectToken,
  signIn,
  signOut,
} from './auth';

/**
 * Sign-in shared by the admin pages that are not the moderation feed.
 *
 * The feed loads itself and checks the token in the same request. These
 * pages only need to know that the person may be here, and then they fetch
 * their own data with the token this hands them.
 */

type Gate =
  | { at: 'loading' }
  | { at: 'anon'; error?: string }
  | { at: 'not-listed'; uid: string }
  | { at: 'error'; message: string }
  | { at: 'ready'; token: string };

export function AdminGate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode | ((token: string) => React.ReactNode);
}) {
  const [state, setState] = useState<Gate>({ at: 'loading' });

  const load = useCallback(async (token: string | null) => {
    if (!token) {
      setState({ at: 'anon' });
      return;
    }
    try {
      const res = await fetch('/api/fornlamningar/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        const body = (await res.json()) as { uid?: string };
        setState({ at: 'not-listed', uid: String(body.uid ?? '') });
        return;
      }
      if (!res.ok) {
        setState({ at: 'error', message: `${res.status}` });
        return;
      }
      setState({ at: 'ready', token });
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
        const token = (await redirectToken()) ?? (await currentToken());
        await load(token);
      } catch (e) {
        setState({ at: 'anon', error: errorCode(e) ?? 'Sign-in failed.' });
      }
    })();
  }, [load]);

  const back =
    title === 'Admin' ? null : (
      <Link href="/fornlamningar/admin" className="fl-back">
        <IconArrowLeft size={16} />
        Admin
      </Link>
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
    return (
      <Stack align="flex-start">
        {back}
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">{title}</h1>
        {state.error ? (
          <Alert color="red" title="Sign-in failed" maw={640}>
            {state.error}
          </Alert>
        ) : null}
        <Button
          mt="md"
          radius="xl"
          color="dark"
          onClick={() => {
            setState({ at: 'loading' });
            void signIn()
              .then(token => {
                if (token !== null) {
                  return load(token);
                }
                return undefined;
              })
              .catch(e =>
                setState({
                  at: 'anon',
                  error: errorCode(e) ?? 'Sign-in failed.',
                })
              );
          }}
        >
          Sign in with Google
        </Button>
      </Stack>
    );
  }

  if (state.at === 'not-listed') {
    return (
      <Stack align="flex-start">
        {back}
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">{title}</h1>
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
        {back}
        <p className="fl-kicker">Fornkoll</p>
        <h1 className="fl-title">{title}</h1>
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

  const token = state.token;
  return (
    <div>
      {back}
      <header className="fl-top">
        <div>
          <p className="fl-kicker">Fornkoll</p>
          <h1 className="fl-title">{title}</h1>
        </div>
        <button
          type="button"
          className="fl-quiet"
          onClick={() => void signOut().then(() => load(null))}
        >
          Sign out
        </button>
      </header>
      {typeof children === 'function' ? children(token) : children}
    </div>
  );
}

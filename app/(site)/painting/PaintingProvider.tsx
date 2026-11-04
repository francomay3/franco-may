'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { getBytes, getDownloadURL, ref } from 'firebase/storage';
import { auth, storage } from '@/app/hackertube/firebase';
import type { Library } from './types';

/**
 * =========================  THE GATE  =========================
 *
 * /painting is private: these are somebody else's paid tutorials and the
 * videos are for Franco (and whoever he adds), not the public.
 *
 * WHO MAY SEE IT IS DECIDED IN ONE PLACE: `PAINTING_VIEWERS` in
 * storage.hackertube.rules. Nothing in this file lists anybody.
 *
 * How the gate works:
 *   1. The visitor signs in with Google (same Firebase project and same sign-in
 *      as /hackertube, so being signed in there counts here).
 *   2. We try to read painting/library.json from Storage. The rules only let
 *      a uid in PAINTING_VIEWERS read it. Anyone else gets
 *      `storage/unauthorized`, and that is the "denied" screen below.
 *   3. The library holds every title, description and video path. Without it
 *      there is nothing to render, so a visitor who is not on the list sees
 *      the sign-in and nothing else. The videos live under the same rule.
 *
 * So the page does not decide who is allowed; it just shows what the rules
 * refused. Do not add a uid list here: two lists would disagree.
 *
 * ADDING SOMEONE (e.g. Franco's wife):
 *   a. She opens /painting and signs in with Google. She sees "This account
 *      isn't on the list" and her uid, which she sends to Franco.
 *   b. Add that uid to PAINTING_VIEWERS in storage.hackertube.rules.
 *   c. Deploy: firebase deploy --only storage \
 *        --config firebase.hackertube.json --project franco-may
 *   d. She reloads. Nothing else changes: no code, no deploy of the site.
 *
 * WHAT IS NOT BEHIND THE GATE: the images (public/painting/*.webp) are static
 * files in the repo, so anyone who guesses a path can fetch one. The text and
 * the videos are the protected part.
 */

type Gate =
  | { at: 'loading' }
  | { at: 'anon'; error?: string }
  | { at: 'denied'; uid: string }
  | { at: 'error'; message: string }
  | { at: 'ready'; user: User; library: Library };

export type PaintingContext = {
  user: User;
  library: Library;
};

const Context = createContext<PaintingContext | null>(null);

export function usePainting(): PaintingContext {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('usePainting must be used inside PaintingProvider');
  }
  return ctx;
}

/**
 * A playable address for one video.
 *
 * The one place the gate is softer than for the text. A <video> element cannot
 * send an auth header, so it needs a URL, and a Storage download URL carries
 * its own token and bypasses the rules. It is not a hole in practice: Firebase
 * only mints it for a caller the rules let read the file's metadata (the same
 * PAINTING_VIEWERS), and nothing stores it. But a copied URL keeps working
 * until the token is revoked, so do not share one.
 */
export function videoUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

function errorCode(e: unknown): string {
  return e && typeof e === 'object' && 'code' in e
    ? String((e as { code: unknown }).code)
    : '';
}

async function loadLibrary(): Promise<Library> {
  // getBytes goes through the rules on every call.
  const buf = await getBytes(ref(storage, 'painting/library.json'));
  return JSON.parse(new TextDecoder().decode(buf)) as Library;
}

export function PaintingProvider({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<Gate>({ at: 'loading' });

  useEffect(
    () =>
      onAuthStateChanged(auth, async user => {
        if (!user) {
          setGate({ at: 'anon' });
          return;
        }
        setGate({ at: 'loading' });
        try {
          setGate({ at: 'ready', user, library: await loadLibrary() });
        } catch (e) {
          const code = errorCode(e);
          if (code === 'storage/unauthorized') {
            setGate({ at: 'denied', uid: user.uid });
          } else {
            setGate({
              at: 'error',
              message: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }),
    []
  );

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = errorCode(e);
      if (code === 'auth/popup-closed-by-user') {
        return;
      }
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return;
      }
      setGate({ at: 'anon', error: code || String(e) });
    }
  };

  const value = useMemo(
    () =>
      gate.at === 'ready' ? { user: gate.user, library: gate.library } : null,
    [gate]
  );

  if (gate.at === 'loading') {
    return (
      <Centered>
        <Loader />
        <Text c="dimmed" size="sm">
          Loading…
        </Text>
      </Centered>
    );
  }

  if (gate.at === 'anon') {
    return (
      <Centered>
        <Title order={2}>Painting</Title>
        <Text c="dimmed">Private. Sign in to continue.</Text>
        <Button leftSection={<IconBrandGoogle size={18} />} onClick={signIn}>
          Sign in with Google
        </Button>
        {gate.error && (
          <Text c="red" size="sm">
            {gate.error}
          </Text>
        )}
      </Centered>
    );
  }

  if (gate.at === 'denied') {
    return (
      <Centered>
        <Title order={3}>This account isn&apos;t on the list</Title>
        <Text c="dimmed" size="sm" maw={460}>
          To allow it, add this uid to <code>PAINTING_VIEWERS</code> in{' '}
          <code>storage.hackertube.rules</code> and redeploy the rules:
        </Text>
        <code>{gate.uid}</code>
        <Button variant="default" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </Centered>
    );
  }

  if (gate.at === 'error' || !value) {
    return (
      <Centered>
        <Alert color="red" title="Could not load the library" maw={520}>
          {gate.at === 'error' ? gate.message : 'Unknown error'}
        </Alert>
        <Button variant="default" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </Centered>
    );
  }

  return (
    <Context.Provider value={value}>
      <Group justify="flex-end" gap="xs" mb="xs">
        <Text c="dimmed" size="xs">
          {value.user.email}
        </Text>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => signOut(auth)}
        >
          Sign out
        </Button>
      </Group>
      {children}
    </Context.Provider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Stack align="center" justify="center" gap="sm" mih="50vh" ta="center">
      {children}
    </Stack>
  );
}

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Button, Loader, Text } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { loadDataset } from './data';
import { auth } from './firebase';
import { type Bounds, type SavedSearch, Taxonomy, boundsOf } from './filters';
import type { SimilarityData } from './similar';
import styles from './hackertube.module.css';
import {
  type Reaction,
  deleteSearch,
  loadUserData,
  parseUserData,
  saveSearch,
  setReaction,
  setSeen,
  setWatchLater,
} from './seen';
import type { Dataset, Video } from './types';

/**
 * Everything the pages of /hackertube share: who is signed in, the dataset,
 * and the person's own state (seen, watch later, saved searches).
 *
 * It lives in the layout so it survives moving between the list, a video and a
 * channel. Without that, every click would download the 7 MB dataset again.
 */
export type HackerTubeContext = {
  user: User;
  data: Dataset;
  taxonomy: Taxonomy;
  bounds: Bounds;
  indexOf: ReadonlyMap<string, number>;
  videoById: ReadonlyMap<string, Video>;
  categoryName: ReadonlyMap<string, string>;
  /** What the "similar to this" sections are computed from. */
  similarity: SimilarityData;
  seen: ReadonlySet<string>;
  markSeen: (id: string, value: boolean) => void;
  /** Video id to when it was added. */
  watchLater: ReadonlyMap<string, number>;
  toggleWatchLater: (id: string, on: boolean) => void;
  /** Video id to when it was liked. A video is never in both maps. */
  liked: ReadonlyMap<string, number>;
  disliked: ReadonlyMap<string, number>;
  /** Like, mark "not interested", or (null) take either back. */
  react: (id: string, reaction: Reaction | null) => void;
  searches: SavedSearch[];
  putSearch: (search: SavedSearch) => void;
  removeSearch: (search: SavedSearch) => void;
};

const Context = createContext<HackerTubeContext | null>(null);

export function useHackerTube(): HackerTubeContext {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useHackerTube must be used inside HackerTubeProvider');
  }
  return ctx;
}

type Gate =
  | { at: 'loading' }
  | { at: 'anon'; error?: string }
  | { at: 'denied'; uid: string }
  | { at: 'error'; message: string }
  | {
      at: 'ready';
      user: User;
      data: Dataset;
      seen: Set<string>;
      watchLater: Map<string, number>;
      liked: Map<string, number>;
      disliked: Map<string, number>;
      searches: SavedSearch[];
    };

function errorCode(e: unknown): string {
  return e && typeof e === 'object' && 'code' in e
    ? String((e as { code: unknown }).code)
    : '';
}

/**
 * The site theme asks for "Source Serif 4" and "Poppins", but nothing loads
 * them, so Mantine's own controls fall back to Times while the text this page
 * styles is sans-serif. Portals (the mobile filters drawer, dropdowns, the
 * save dialog) render outside the page's container, so a class on it cannot
 * reach them. Overriding the variables on :root does, and is undone on leave
 * so the rest of the site is untouched.
 */
const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function useSansFonts() {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--mantine-font-family', SANS);
    root.setProperty('--mantine-font-family-headings', SANS);
    return () => {
      root.removeProperty('--mantine-font-family');
      root.removeProperty('--mantine-font-family-headings');
    };
  }, []);
}

export function HackerTubeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSansFonts();
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
          const [data, rawUser] = await Promise.all([
            loadDataset(),
            loadUserData(user.uid),
          ]);
          const { seen, watchLater, liked, disliked, searches } = parseUserData(
            rawUser,
            boundsOf(data.videos),
            new Taxonomy(data.areas)
          );
          setGate({
            at: 'ready',
            user,
            data,
            seen,
            watchLater,
            liked,
            disliked,
            searches,
          });
        } catch (e) {
          // The rules are the only allow-list, so "not allowed" is whatever
          // they refuse, and the page does not need to know who is on it.
          const code = errorCode(e);
          if (code === 'storage/unauthorized' || code === 'permission-denied') {
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

  if (gate.at === 'loading') {
    return (
      <div className={`${styles.shell} ${styles.center}`}>
        <Loader color="orange" />
        <Text c="dimmed" size="sm">
          Loading…
        </Text>
      </div>
    );
  }

  if (gate.at === 'anon') {
    return (
      <div className={`${styles.shell} ${styles.center}`}>
        <div className={styles.brand} style={{ fontSize: '1.8rem' }}>
          Hacker<span>Tube</span>
        </div>
        <Text c="dimmed">
          Videos Hacker News keeps telling each other to watch.
        </Text>
        <Button
          color="orange"
          leftSection={<IconBrandGoogle size={18} />}
          onClick={signIn}
        >
          Sign in with Google
        </Button>
        {gate.error && (
          <Text c="red" size="sm">
            {gate.error}
          </Text>
        )}
      </div>
    );
  }

  if (gate.at === 'denied') {
    return (
      <div className={`${styles.shell} ${styles.center}`}>
        <Text fw={700} size="lg">
          This account isn&apos;t on the list
        </Text>
        <Text c="dimmed" size="sm" maw={460}>
          To allow it, add this uid to both{' '}
          <code>firestore.hackertube.rules</code> and{' '}
          <code>storage.hackertube.rules</code> and redeploy them:
        </Text>
        <code>{gate.uid}</code>
        <Button variant="default" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </div>
    );
  }

  if (gate.at === 'error') {
    return (
      <div className={`${styles.shell} ${styles.center}`}>
        <Alert color="red" title="Could not load the data" maw={520}>
          {gate.message}
        </Alert>
        <Button variant="default" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Ready
      user={gate.user}
      data={gate.data}
      initialSeen={gate.seen}
      initialWatchLater={gate.watchLater}
      initialLiked={gate.liked}
      initialDisliked={gate.disliked}
      initialSearches={gate.searches}
    >
      {children}
    </Ready>
  );
}

function Ready({
  user,
  data,
  initialSeen,
  initialWatchLater,
  initialLiked,
  initialDisliked,
  initialSearches,
  children,
}: {
  user: User;
  data: Dataset;
  initialSeen: Set<string>;
  initialWatchLater: Map<string, number>;
  initialLiked: Map<string, number>;
  initialDisliked: Map<string, number>;
  initialSearches: SavedSearch[];
  children: React.ReactNode;
}) {
  const taxonomy = useMemo(() => new Taxonomy(data.areas), [data.areas]);
  const bounds = useMemo(() => boundsOf(data.videos), [data.videos]);
  const indexOf = useMemo(
    () => new Map(data.videos.map((v, i) => [v.id, i])),
    [data.videos]
  );
  const videoById = useMemo(
    () => new Map(data.videos.map(v => [v.id, v])),
    [data.videos]
  );
  const categoryName = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of data.areas) {
      for (const c of a.categories) {
        m.set(c.id, c.name);
      }
    }
    return m;
  }, [data.areas]);

  const similarity = useMemo<SimilarityData>(
    () => ({
      videos: data.videos,
      indexOf,
      embeddings: data.embeddings,
      related: data.related,
    }),
    [data.videos, data.embeddings, data.related, indexOf]
  );

  const [seen, setSeenSet] = useState(initialSeen);
  const [watchLater, setWatchLaterMap] = useState(initialWatchLater);
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [searches, setSearches] = useState(initialSearches);
  const [failure, setFailure] = useState<string | null>(null);

  const fail = useCallback((e: unknown) => {
    setFailure(e instanceof Error ? e.message : String(e));
  }, []);

  const markSeen = useCallback(
    (id: string, value: boolean) => {
      const flip = (on: boolean) =>
        setSeenSet(prev => {
          if (prev.has(id) === on) {
            return prev;
          }
          const next = new Set(prev);
          if (on) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      flip(value);
      setSeen(user.uid, id, value).catch(e => {
        // Put it back: a seen mark that did not save would be a lie.
        flip(!value);
        fail(e);
      });
    },
    [user.uid, fail]
  );

  const toggleWatchLater = useCallback(
    (id: string, on: boolean) => {
      const apply = (add: boolean, at: number) =>
        setWatchLaterMap(prev => {
          if (prev.has(id) === add) {
            return prev;
          }
          const next = new Map(prev);
          if (add) {
            next.set(id, at);
          } else {
            next.delete(id);
          }
          return next;
        });
      const previous = watchLater.get(id);
      apply(on, Date.now());
      setWatchLater(user.uid, id, on).catch(e => {
        apply(previous !== undefined, previous ?? 0);
        fail(e);
      });
    },
    [user.uid, watchLater, fail]
  );

  const react = useCallback(
    (id: string, reaction: Reaction | null) => {
      // Functional updates, so several quick clicks each keep their own.
      const put =
        (on: boolean, at: number | undefined) =>
        (prev: ReadonlyMap<string, number>) => {
          if (prev.has(id) === on) {
            return prev as Map<string, number>;
          }
          const next = new Map(prev);
          if (on) {
            next.set(id, at ?? Date.now());
          } else {
            next.delete(id);
          }
          return next;
        };
      const wasLiked = liked.get(id);
      const wasDisliked = disliked.get(id);
      setLiked(put(reaction === 'like', undefined));
      setDisliked(put(reaction === 'dislike', undefined));
      setReaction(user.uid, id, reaction).catch(e => {
        setLiked(put(wasLiked !== undefined, wasLiked));
        setDisliked(put(wasDisliked !== undefined, wasDisliked));
        fail(e);
      });
    },
    [user.uid, liked, disliked, fail]
  );

  const putSearch = useCallback(
    (search: SavedSearch) => {
      const before = searches;
      setSearches([search, ...before.filter(s => s.id !== search.id)]);
      saveSearch(user.uid, search).catch(e => {
        setSearches(before);
        fail(e);
      });
    },
    [user.uid, searches, fail]
  );

  const removeSearch = useCallback(
    (search: SavedSearch) => {
      const before = searches;
      setSearches(before.filter(s => s.id !== search.id));
      deleteSearch(user.uid, search.id).catch(e => {
        setSearches(before);
        fail(e);
      });
    },
    [user.uid, searches, fail]
  );

  const value = useMemo<HackerTubeContext>(
    () => ({
      user,
      data,
      taxonomy,
      bounds,
      indexOf,
      videoById,
      categoryName,
      similarity,
      seen,
      markSeen,
      watchLater,
      toggleWatchLater,
      liked,
      disliked,
      react,
      searches,
      putSearch,
      removeSearch,
    }),
    [
      user,
      data,
      taxonomy,
      bounds,
      indexOf,
      videoById,
      categoryName,
      similarity,
      seen,
      markSeen,
      watchLater,
      toggleWatchLater,
      liked,
      disliked,
      react,
      searches,
      putSearch,
      removeSearch,
    ]
  );

  return (
    <Context.Provider value={value}>
      {children}
      {failure && (
        <Alert
          color="red"
          title="Could not save"
          withCloseButton
          onClose={() => setFailure(null)}
          className={styles.toast}
        >
          {failure}
        </Alert>
      )}
    </Context.Provider>
  );
}

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Loader,
  Menu,
  Select,
  Text,
} from '@mantine/core';
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from '@mantine/hooks';
import {
  IconAdjustments,
  IconBrandGoogle,
  IconLogout,
} from '@tabler/icons-react';
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
import { FilterPanel } from './FilterPanel';
import {
  type FilterState,
  type SortKey,
  Taxonomy,
  applyFilters,
  boundsOf,
  emptyFilters,
  sortVideos,
} from './filters';
import styles from './hackertube.module.css';
import { embedQuery, similarities } from './search';
import { loadSeen, setSeen } from './seen';
import type { Dataset } from './types';
import { VideoRow } from './VideoRow';

type Gate =
  | { at: 'loading' }
  | { at: 'anon'; error?: string }
  | { at: 'denied'; uid: string }
  | { at: 'error'; message: string }
  | { at: 'ready'; user: User; data: Dataset; seen: Set<string> };

const PAGE = 50;

function errorCode(e: unknown): string {
  return e && typeof e === 'object' && 'code' in e
    ? String((e as { code: unknown }).code)
    : '';
}

export function HackerTube() {
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
          const [data, seen] = await Promise.all([
            loadDataset(),
            loadSeen(user.uid),
          ]);
          setGate({ at: 'ready', user, data, seen });
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

  return <Browser user={gate.user} data={gate.data} initialSeen={gate.seen} />;
}

const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Most relevant',
  rating: 'Highest rated',
  newest: 'Newest',
  oldest: 'Oldest',
  views: 'Most viewed',
  longest: 'Longest',
  shortest: 'Shortest',
};

function Browser({
  user,
  data,
  initialSeen,
}: {
  user: User;
  data: Dataset;
  initialSeen: Set<string>;
}) {
  const taxonomy = useMemo(() => new Taxonomy(data.areas), [data.areas]);
  const bounds = useMemo(() => boundsOf(data.videos), [data.videos]);
  const indexOf = useMemo(
    () => new Map(data.videos.map((v, i) => [v.id, i])),
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

  const [filters, setFilters] = useState<FilterState>(() =>
    emptyFilters(bounds)
  );
  const [seen, setSeenSet] = useState(initialSeen);
  const [sort, setSort] = useState<SortKey>('rating');
  const [visible, setVisible] = useState(PAGE);
  const [failure, setFailure] = useState<string | null>(null);
  const [drawerOpen, drawer] = useDisclosure(false);
  const narrow = useMediaQuery('(max-width: 960px)');

  // ---- semantic search -------------------------------------------------
  const [draft, setDraft] = useState('');
  const [debounced] = useDebouncedValue(draft.trim(), 450);
  const [sims, setSims] = useState<Float32Array | null>(null);
  const [searching, setSearching] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const latest = useRef(0);

  useEffect(() => {
    setFilters(f => (f.query === debounced ? f : { ...f, query: debounced }));
    const run = ++latest.current;
    if (!debounced) {
      setSims(null);
      setSearching('idle');
      setSort(s => (s === 'relevance' ? 'rating' : s));
      return;
    }
    setSearching('loading');
    embedQuery(debounced)
      .then(q => {
        if (run !== latest.current) {
          return;
        }
        setSims(similarities(q, data.embeddings));
        setSearching('idle');
        setSort('relevance');
      })
      .catch(() => {
        if (run === latest.current) {
          setSearching('error');
        }
      });
  }, [debounced, data.embeddings]);

  // ---- seen ------------------------------------------------------------
  const mark = useCallback(
    (id: string, value: boolean) => {
      setSeenSet(prev => {
        if (prev.has(id) === value) {
          return prev;
        }
        const next = new Set(prev);
        if (value) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
      setSeen(user.uid, id, value).catch(e => {
        // Put it back: a seen mark that did not save would be a lie.
        setSeenSet(prev => {
          const next = new Set(prev);
          if (value) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setFailure(e instanceof Error ? e.message : String(e));
      });
    },
    [user.uid]
  );
  const onOpen = useCallback((id: string) => mark(id, true), [mark]);

  // ---- the list --------------------------------------------------------
  const sorted = useMemo(() => {
    const filtered = applyFilters(data.videos, filters, taxonomy, seen);
    return sortVideos(filtered, sort, sims, indexOf);
  }, [data.videos, filters, taxonomy, seen, sort, sims, indexOf]);

  // Back to the top of the list whenever what it holds changes.
  useEffect(() => {
    setVisible(PAGE);
  }, [filters, sort]);

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(n => n + PAGE);
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sorted.length]);

  const resetFilters = () => {
    setFilters(emptyFilters(bounds));
    setDraft('');
  };

  const panel = (
    <FilterPanel
      state={filters}
      onChange={setFilters}
      onReset={resetFilters}
      bounds={bounds}
      taxonomy={taxonomy}
      videos={data.videos}
      queryDraft={draft}
      onQueryDraft={setDraft}
      searching={searching}
    />
  );

  const sortOptions = (Object.keys(SORT_LABELS) as SortKey[])
    .filter(k => k !== 'relevance' || sims)
    .map(k => ({ value: k, label: SORT_LABELS[k] }));

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          Hacker<span>Tube</span>
        </div>
        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
          {sorted.length.toLocaleString()} of{' '}
          {data.videos.length.toLocaleString()} videos · {seen.size} seen
        </Text>
        {narrow && (
          <Button
            variant="default"
            size="xs"
            leftSection={<IconAdjustments size={16} />}
            onClick={drawer.open}
          >
            Filters
          </Button>
        )}
        <Select
          size="xs"
          w={150}
          allowDeselect={false}
          value={sort}
          onChange={v => v && setSort(v as SortKey)}
          data={sortOptions}
          aria-label="Sort"
        />
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <Avatar
              src={user.photoURL}
              alt={user.displayName ?? ''}
              radius="xl"
              size={32}
              style={{ cursor: 'pointer' }}
            >
              {user.displayName?.[0]}
            </Avatar>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{user.email}</Menu.Label>
            <Menu.Item
              leftSection={<IconLogout size={14} />}
              onClick={() => signOut(auth)}
            >
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </header>

      <div className={styles.layout}>
        <aside className={styles.aside}>{panel}</aside>

        <main className={styles.main}>
          {failure && (
            <Alert
              color="red"
              mb="md"
              withCloseButton
              onClose={() => setFailure(null)}
              title="Could not save"
            >
              {failure}
            </Alert>
          )}

          {sorted.slice(0, visible).map(v => (
            <VideoRow
              key={v.id}
              video={v}
              seen={seen.has(v.id)}
              categoryNames={v.cats.map(c => categoryName.get(c) ?? c)}
              onOpen={onOpen}
              onToggleSeen={mark}
            />
          ))}

          {sorted.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Nothing matches these filters.
            </Text>
          )}
          {visible < sorted.length && (
            <div ref={sentinel} style={{ height: 1 }} />
          )}
        </main>
      </div>

      <Drawer
        opened={drawerOpen && !!narrow}
        onClose={drawer.close}
        title="Filters"
        size="min(380px, 100%)"
      >
        {panel}
      </Drawer>
    </div>
  );
}

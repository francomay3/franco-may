'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActionIcon,
  Alert,
  Avatar,
  Button,
  Drawer,
  Indicator,
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
  type Bounds,
  type FilterState,
  type SavedSearch,
  type SortKey,
  Taxonomy,
  activeCount,
  applyFilters,
  boundsOf,
  emptyFilters,
  restoreFilters,
  restoreSort,
  sortVideos,
} from './filters';
import styles from './hackertube.module.css';
import {
  combineRelevance,
  embedQuery,
  excludeMask,
  similarities,
} from './search';
import {
  deleteSearch,
  loadUserData,
  parseUserData,
  saveSearch,
  setSeen,
} from './seen';
import type { Dataset } from './types';
import { VideoRow } from './VideoRow';

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
      searches: SavedSearch[];
    };

const PAGE = 50;

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

export function HackerTube() {
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
          const { seen, searches } = parseUserData(
            rawUser,
            boundsOf(data.videos),
            new Taxonomy(data.areas)
          );
          setGate({ at: 'ready', user, data, seen, searches });
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
    <Browser
      user={gate.user}
      data={gate.data}
      initialSeen={gate.seen}
      initialSearches={gate.searches}
    />
  );
}

const SORT_LABELS: Record<SortKey, string> = {
  best: 'Best match',
  relevance: 'Most relevant',
  rating: 'Highest rated',
  newest: 'Newest',
  oldest: 'Oldest',
  views: 'Most viewed',
  longest: 'Longest',
  shortest: 'Shortest',
};

/**
 * The current selection, kept per person on this device so reopening the page
 * finds it as it was left. Per uid, because two people can share a browser.
 * Anything unreadable falls back to an empty selection: this is a convenience
 * and must never stop the page from loading.
 */
const stateKey = (uid: string) => `hackertube:state:${uid}`;

function readStored(uid: string, bounds: Bounds, tax: Taxonomy) {
  let raw: { filters?: unknown; sort?: unknown } | null = null;
  try {
    raw = JSON.parse(localStorage.getItem(stateKey(uid)) ?? 'null');
  } catch {
    raw = null;
  }
  const filters = restoreFilters(raw?.filters, bounds, tax);
  return { filters, sort: restoreSort(raw?.sort, filters.query) };
}

function Browser({
  user,
  data,
  initialSeen,
  initialSearches,
}: {
  user: User;
  data: Dataset;
  initialSeen: Set<string>;
  initialSearches: SavedSearch[];
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

  const [stored] = useState(() => readStored(user.uid, bounds, taxonomy));
  const [filters, setFilters] = useState<FilterState>(stored.filters);
  const [seen, setSeenSet] = useState(initialSeen);
  const [searches, setSearches] = useState(initialSearches);
  const [sort, setSort] = useState<SortKey>(stored.sort);
  const [visible, setVisible] = useState(PAGE);
  const [failure, setFailure] = useState<string | null>(null);
  const [drawerOpen, drawer] = useDisclosure(false);
  const narrow = useMediaQuery('(max-width: 960px)');

  // ---- semantic search -------------------------------------------------
  const [draft, setDraft] = useState(stored.filters.query);
  const [excludeDraft, setExcludeDraft] = useState(stored.filters.exclude);
  const [debounced] = useDebouncedValue(draft.trim(), 450);
  const [debouncedExclude] = useDebouncedValue(excludeDraft.trim(), 450);
  const [simsPos, setSimsPos] = useState<Float32Array | null>(null);
  const [simsNeg, setSimsNeg] = useState<Float32Array | null>(null);
  const [searching, setSearching] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const latest = useRef(0);
  const lastQuery = useRef(debounced);
  // A query that arrives with its own sort (a saved search) must not be
  // overridden by "a new query sorts by best match".
  const keepSort = useRef(false);

  useEffect(() => {
    setFilters(f =>
      f.query === debounced && f.exclude === debouncedExclude
        ? f
        : { ...f, query: debounced, exclude: debouncedExclude }
    );
    // Only a changed query picks a sort for you. Editing the exclude text, or
    // the page loading with a restored query, leaves your sort alone.
    const queryChanged = debounced !== lastQuery.current;
    lastQuery.current = debounced;

    const run = ++latest.current;
    if (!debounced) {
      // Without a query there is nothing to be relevant to.
      setSimsPos(null);
      setSort(s => (s === 'relevance' || s === 'best' ? 'rating' : s));
    }
    if (!debounced && !debouncedExclude) {
      setSimsNeg(null);
      setSearching('idle');
      return;
    }
    setSearching('loading');
    Promise.all([
      debounced ? embedQuery(debounced) : Promise.resolve(null),
      debouncedExclude ? embedQuery(debouncedExclude) : Promise.resolve(null),
    ])
      .then(([pos, neg]) => {
        if (run !== latest.current) {
          return;
        }
        setSimsPos(pos ? similarities(pos, data.embeddings) : null);
        setSimsNeg(neg ? similarities(neg, data.embeddings) : null);
        setSearching('idle');
        if (debounced && queryChanged && !keepSort.current) {
          setSort('best');
        }
        keepSort.current = false;
      })
      .catch(() => {
        if (run === latest.current) {
          setSearching('error');
        }
      });
  }, [debounced, debouncedExclude, data.embeddings]);

  const relevance = useMemo(
    () => combineRelevance(simsPos, simsNeg, filters.excludeStrength),
    [simsPos, simsNeg, filters.excludeStrength]
  );
  // With a query the exclude pulls matches down the ranking. With none there
  // is no ranking to pull them down in, so it hides them instead.
  const hidden = useMemo(
    () => (simsPos ? null : excludeMask(simsNeg, filters.excludeStrength)),
    [simsPos, simsNeg, filters.excludeStrength]
  );

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
    let filtered = applyFilters(data.videos, filters, taxonomy, seen);
    if (hidden) {
      filtered = filtered.filter(v => !hidden[indexOf.get(v.id)!]);
    }
    return sortVideos(filtered, sort, relevance, indexOf, filters.blend);
  }, [data.videos, filters, taxonomy, seen, sort, relevance, hidden, indexOf]);

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
    setExcludeDraft('');
  };

  // Remember the selection on this device.
  useEffect(() => {
    try {
      localStorage.setItem(
        stateKey(user.uid),
        JSON.stringify({ filters, sort })
      );
    } catch {
      // Storage can be full or blocked; the page works without it.
    }
  }, [filters, sort, user.uid]);

  // ---- saved searches --------------------------------------------------
  const onSaveSearch = (name: string) => {
    const query = draft.trim();
    const existing = searches.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
    const search: SavedSearch = {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      // filters.query lags the box by the debounce; save what is on screen.
      filters: { ...filters, query, exclude: excludeDraft.trim() },
      sort,
      createdAt: Date.now(),
    };
    const before = searches;
    setSearches([search, ...before.filter(s => s.id !== search.id)]);
    saveSearch(user.uid, search).catch(e => {
      setSearches(before);
      setFailure(e instanceof Error ? e.message : String(e));
    });
  };

  const onApplySearch = (search: SavedSearch) => {
    const query = search.filters.query.trim();
    if (query !== debounced) {
      // Stale similarities belong to the old query; the saved sort wins.
      setSimsPos(null);
      setSimsNeg(null);
      keepSort.current = !!query;
    }
    setFilters(search.filters);
    setDraft(search.filters.query);
    setExcludeDraft(search.filters.exclude);
    setSort(search.sort);
    drawer.close();
  };

  const onDeleteSearch = (search: SavedSearch) => {
    // A native confirm is enough for a rare, personal delete.
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete the saved search "${search.name}"?`)) {
      return;
    }
    const before = searches;
    setSearches(before.filter(s => s.id !== search.id));
    deleteSearch(user.uid, search.id).catch(e => {
      setSearches(before);
      setFailure(e instanceof Error ? e.message : String(e));
    });
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
      excludeDraft={excludeDraft}
      onExcludeDraft={setExcludeDraft}
      sort={sort}
      searching={searching}
      searches={searches}
      onSaveSearch={onSaveSearch}
      onApplySearch={onApplySearch}
      onDeleteSearch={onDeleteSearch}
    />
  );

  const sortOptions = (Object.keys(SORT_LABELS) as SortKey[])
    .filter(k => (k !== 'relevance' && k !== 'best') || relevance || sort === k)
    .map(k => ({ value: k, label: SORT_LABELS[k] }));

  const summary = `${sorted.length.toLocaleString()} of ${data.videos.length.toLocaleString()} videos · ${seen.size} seen`;
  const active = activeCount(filters, bounds);
  const shortSummary = `${sorted.length.toLocaleString()} of ${data.videos.length.toLocaleString()} · ${seen.size} seen`;

  const sortSelect = (
    <Select
      size="xs"
      w={150}
      allowDeselect={false}
      value={sort}
      onChange={v => v && setSort(v as SortKey)}
      data={sortOptions}
      aria-label="Sort"
    />
  );

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          Hacker<span>Tube</span>
        </div>
        <Text
          size="sm"
          c="dimmed"
          className={styles.headerCount}
          style={{ flex: 1 }}
        >
          {summary}
        </Text>
        <div className={styles.headerSort}>{sortSelect}</div>
        {narrow && (
          <Indicator
            label={active}
            size={16}
            color="orange"
            disabled={active === 0}
            offset={4}
          >
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Filters"
              onClick={drawer.open}
            >
              <IconAdjustments size={18} />
            </ActionIcon>
          </Indicator>
        )}
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
          <div className={styles.toolbar}>
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {shortSummary}
            </Text>
            {sortSelect}
          </div>

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

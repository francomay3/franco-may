'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Drawer, Indicator, Select, Text } from '@mantine/core';
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from '@mantine/hooks';
import { IconAdjustments } from '@tabler/icons-react';
import { FilterPanel } from './FilterPanel';
import {
  type Bounds,
  type FilterState,
  type SavedSearch,
  type SortKey,
  type Taxonomy,
  activeCount,
  applyFilters,
  emptyFilters,
  restoreFilters,
  restoreSort,
  sortVideos,
} from './filters';
import { BrandLink, UserMenu } from './Header';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';
import {
  combineRelevance,
  embedQuery,
  excludeMask,
  similarities,
} from './search';
import { VideoRow } from './VideoRow';

const PAGE = 50;

const SORT_LABELS: Record<SortKey, string> = {
  best: 'Best match',
  relevance: 'Most relevant',
  added: 'Recently added',
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

/**
 * Where the list was when you left it for a video or a channel, so Back lands
 * on the same row instead of the top. Saved on click rather than on unmount,
 * because by the time the page unmounts the browser may already have scrolled
 * to the top for the next one. Used once, then forgotten.
 */
const listKey = (uid: string) => `hackertube:list:${uid}`;

function readList(uid: string): { visible: number; scrollY: number } | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(listKey(uid)) ?? 'null');
    if (typeof raw?.visible === 'number' && typeof raw?.scrollY === 'number') {
      return raw;
    }
  } catch {
    // Unreadable means no saved position, which is fine.
  }
  return null;
}

export function Browser() {
  const {
    user,
    data,
    taxonomy,
    bounds,
    indexOf,
    categoryName,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
    searches,
    putSearch,
    removeSearch,
  } = useHackerTube();

  const [stored] = useState(() => readStored(user.uid, bounds, taxonomy));
  const [restored] = useState(() => readList(user.uid));
  const [filters, setFilters] = useState<FilterState>(stored.filters);
  const [sort, setSort] = useState<SortKey>(stored.sort);
  const [visible, setVisible] = useState(restored?.visible ?? PAGE);
  const [drawerOpen, drawer] = useDisclosure(false);
  const narrow = useMediaQuery('(max-width: 960px)');
  const sortBeforePlaylist = useRef<SortKey>('rating');

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

  // ---- the list --------------------------------------------------------
  const sorted = useMemo(() => {
    let filtered = applyFilters(
      data.videos,
      filters,
      taxonomy,
      seen,
      watchLater
    );
    if (hidden) {
      filtered = filtered.filter(v => !hidden[indexOf.get(v.id)!]);
    }
    return sortVideos(
      filtered,
      sort,
      relevance,
      indexOf,
      filters.blend,
      watchLater
    );
  }, [
    data.videos,
    filters,
    taxonomy,
    seen,
    watchLater,
    sort,
    relevance,
    hidden,
    indexOf,
  ]);

  // Back to the top of the list whenever what it holds changes -- but not on
  // arrival, which would throw away the position being restored.
  const arrived = useRef(true);
  useEffect(() => {
    if (arrived.current) {
      arrived.current = false;
      return;
    }
    setVisible(PAGE);
  }, [filters, sort]);

  useEffect(() => {
    if (!restored) {
      return;
    }
    try {
      sessionStorage.removeItem(listKey(user.uid));
    } catch {
      // Nothing to clean up if storage is blocked.
    }
    const frame = requestAnimationFrame(() =>
      window.scrollTo(0, restored.scrollY)
    );
    return () => cancelAnimationFrame(frame);
  }, [restored, user.uid]);

  const rememberPosition = () => {
    try {
      sessionStorage.setItem(
        listKey(user.uid),
        JSON.stringify({ visible, scrollY: window.scrollY })
      );
    } catch {
      // Losing the position is not worth an error.
    }
  };

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

  /**
   * Opening the playlist also sorts it newest-added first, and leaving it puts
   * the sort back, so the playlist behaves like one without a second control.
   */
  const changeFilters = (next: FilterState) => {
    if (next.watchLater !== filters.watchLater) {
      if (next.watchLater === 'only') {
        sortBeforePlaylist.current = sort === 'added' ? 'rating' : sort;
        setSort('added');
      } else if (sort === 'added') {
        setSort(sortBeforePlaylist.current);
      }
    }
    setFilters(next);
  };

  // ---- saved searches --------------------------------------------------
  const onSaveSearch = (name: string) => {
    const existing = searches.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
    putSearch({
      id: existing?.id ?? crypto.randomUUID(),
      name,
      // filters.query lags the box by the debounce; save what is on screen.
      filters: {
        ...filters,
        query: draft.trim(),
        exclude: excludeDraft.trim(),
      },
      sort,
      createdAt: Date.now(),
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
    if (window.confirm(`Delete the saved search "${search.name}"?`)) {
      removeSearch(search);
    }
  };

  const panel = (
    <FilterPanel
      state={filters}
      onChange={changeFilters}
      onReset={resetFilters}
      bounds={bounds}
      taxonomy={taxonomy}
      videos={data.videos}
      queryDraft={draft}
      onQueryDraft={setDraft}
      excludeDraft={excludeDraft}
      onExcludeDraft={setExcludeDraft}
      sort={sort}
      watchLaterCount={watchLater.size}
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
        <BrandLink />
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
        <UserMenu user={user} />
      </header>

      <div className={styles.layout}>
        <aside className={styles.aside}>{panel}</aside>

        <main className={styles.main} onClickCapture={rememberPosition}>
          <div className={styles.toolbar}>
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {shortSummary}
            </Text>
            {sortSelect}
          </div>

          {sorted.slice(0, visible).map(v => (
            <VideoRow
              key={v.id}
              video={v}
              seen={seen.has(v.id)}
              watchLater={watchLater.has(v.id)}
              categoryNames={v.cats.map(c => categoryName.get(c) ?? c)}
              onToggleSeen={markSeen}
              onToggleWatchLater={toggleWatchLater}
            />
          ))}

          {sorted.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              {filters.watchLater === 'only' && watchLater.size === 0
                ? 'Your watch-later playlist is empty. Use the bookmark on a video to add it.'
                : 'Nothing matches these filters.'}
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

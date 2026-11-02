'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ActionIcon,
  Button,
  Loader,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconAdjustments,
  IconRefresh,
  IconSearch,
  IconThumbUp,
  IconX,
} from '@tabler/icons-react';
import { type FeedInput, buildFeed } from './feed';
import { DEFAULT_BLEND, bestMatch } from './filters';
import { ADVANCED_HREF, BrandLink, LIKED_HREF, UserMenu } from './Header';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';
import { embedQuery, similarities } from './search';
import { reactionOf } from './seen';
import { useInfinite } from './useInfinite';
import { VideoRow } from './VideoRow';

const PAGE = 30;

/**
 * What the feed was built from. Kept while you move between pages and rebuilt
 * only by Refresh (or a reload), so liking, dismissing or opening a video does
 * not reshuffle the page under you. The luck is fixed per seed.
 */
type Kept = {
  uid: string;
  input: FeedInput;
  visible: number;
  scrollY: number;
};

let kept: Kept | null = null;

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

export function ForYou() {
  const {
    user,
    data,
    indexOf,
    similarity,
    categoryName,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
    liked,
    disliked,
    react,
  } = useHackerTube();

  const resume = kept?.uid === user.uid ? kept : null;
  const [input, setInput] = useState<FeedInput>(
    () =>
      resume?.input ?? {
        liked: [...liked.keys()],
        disliked: [...disliked.keys()],
        seen: new Set(seen),
        seed: newSeed(),
      }
  );
  const feed = useMemo(() => buildFeed(similarity, input), [similarity, input]);
  // Dismissing takes a video out at once; everything else waits for Refresh.
  const items = useMemo(
    () => feed.items.filter(x => !disliked.has(x.video.id)),
    [feed, disliked]
  );

  // ---- search ----------------------------------------------------------
  const [draft, setDraft] = useState('');
  const [query] = useDebouncedValue(draft.trim(), 450);
  const [sims, setSims] = useState<Float32Array | null>(null);
  const [searching, setSearching] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const latest = useRef(0);

  useEffect(() => {
    const run = ++latest.current;
    if (!query) {
      setSims(null);
      setSearching('idle');
      return;
    }
    setSearching('loading');
    embedQuery(query)
      .then(q => {
        if (run === latest.current) {
          setSims(similarities(q, data.embeddings));
          setSearching('idle');
        }
      })
      .catch(() => {
        if (run === latest.current) {
          setSearching('error');
        }
      });
  }, [query, data.embeddings]);

  const results = useMemo(
    () =>
      sims ? bestMatch([...data.videos], sims, indexOf, DEFAULT_BLEND) : [],
    [sims, data.videos, indexOf]
  );

  const searchMode = query !== '' || draft.trim() !== '';
  const showingResults = query !== '' && sims !== null;
  const length = showingResults ? results.length : items.length;
  const { visible, sentinel, reset } = useInfinite(
    length,
    PAGE,
    resume?.visible
  );

  // Back to the top whenever the list is replaced -- not on arrival, which
  // would throw away the position being restored.
  const arrived = useRef(true);
  useEffect(() => {
    if (arrived.current) {
      arrived.current = false;
      return;
    }
    reset();
  }, [showingResults, query, input]);

  useEffect(() => {
    if (!resume) {
      return;
    }
    const frame = requestAnimationFrame(() =>
      window.scrollTo(0, resume.scrollY)
    );
    return () => cancelAnimationFrame(frame);
    // Once, on arrival.
  }, []);

  const remember = () => {
    kept = {
      uid: user.uid,
      input,
      visible,
      scrollY: window.scrollY,
    };
  };

  const refresh = () => {
    setInput({
      liked: [...liked.keys()],
      disliked: [...disliked.keys()],
      seen: new Set(seen),
      seed: newSeed(),
    });
    window.scrollTo(0, 0);
  };

  const searchBox = (
    <TextInput
      className={styles.searchBox}
      value={draft}
      onChange={e => setDraft(e.currentTarget.value)}
      placeholder="Search by topic, idea or title"
      aria-label="Search"
      leftSection={
        searching === 'loading' ? (
          <Loader size={14} color="orange" />
        ) : (
          <IconSearch size={16} />
        )
      }
      rightSection={
        draft ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Clear search"
            onClick={() => setDraft('')}
          >
            <IconX size={14} />
          </ActionIcon>
        ) : null
      }
      radius="xl"
    />
  );

  const likedCount = liked.size;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <BrandLink />
        <div className={styles.headerSearch}>{searchBox}</div>
        <Tooltip label="Liked" withArrow>
          <ActionIcon
            component={Link}
            href={LIKED_HREF}
            variant="default"
            size="lg"
            aria-label="Liked"
          >
            <IconThumbUp size={18} />
          </ActionIcon>
        </Tooltip>
        <Button
          component={Link}
          href={ADVANCED_HREF}
          variant="default"
          leftSection={<IconAdjustments size={16} />}
          className={styles.advancedButton}
        >
          Advanced search
        </Button>
        <Tooltip label="Advanced search" withArrow>
          <ActionIcon
            component={Link}
            href={ADVANCED_HREF}
            variant="default"
            size="lg"
            aria-label="Advanced search"
            className={styles.advancedIcon}
          >
            <IconAdjustments size={18} />
          </ActionIcon>
        </Tooltip>
        <UserMenu user={user} />
      </header>

      <main
        className={`${styles.page} ${styles.feedPage}`}
        onClickCapture={remember}
      >
        <div className={styles.mobileSearch}>{searchBox}</div>

        <div className={styles.feedHead}>
          <div>
            <h1 className={styles.feedTitle}>
              {showingResults ? 'Results' : 'For you'}
            </h1>
            <Text size="sm" c="dimmed">
              {showingResults
                ? `${results.length.toLocaleString()} videos, best match first`
                : feed.personalised
                  ? `Based on your ${input.liked.length} like${input.liked.length === 1 ? '' : 's'}`
                  : 'Like a few videos to personalise this. Until then: the best-rated ones, shuffled.'}
            </Text>
          </div>
          {!searchMode && (
            <Button
              variant="default"
              size="compact-md"
              leftSection={<IconRefresh size={16} />}
              onClick={refresh}
            >
              Refresh
            </Button>
          )}
        </div>

        {searching === 'error' && (
          <Text c="red" size="sm" mb="md">
            Could not load the search model. Check your connection and try
            again.
          </Text>
        )}

        {searchMode && !showingResults
          ? searching !== 'error' && (
              <Text c="dimmed" ta="center" py="xl">
                Searching…
              </Text>
            )
          : (showingResults
              ? results
                  .slice(0, visible)
                  .map(v => ({ video: v, because: null }))
              : items.slice(0, visible)
            ).map(({ video: v, because }) => (
              <VideoRow
                key={v.id}
                video={v}
                seen={seen.has(v.id)}
                watchLater={watchLater.has(v.id)}
                categoryNames={v.cats.map(c => categoryName.get(c) ?? c)}
                reaction={reactionOf(v.id, liked, disliked)}
                onReact={react}
                because={because?.title}
                onToggleSeen={markSeen}
                onToggleWatchLater={toggleWatchLater}
              />
            ))}

        {length === 0 && !searchMode && (
          <Text c="dimmed" ta="center" py="xl">
            {likedCount > 0
              ? 'Nothing left to suggest right now.'
              : 'Nothing to show.'}
          </Text>
        )}
        {visible < length && <div ref={sentinel} style={{ height: 1 }} />}
      </main>
    </div>
  );
}

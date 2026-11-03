'use client';

import React, { useMemo } from 'react';
import { Text } from '@mantine/core';
import { BackButton } from './BackButton';
import { SimpleHeader } from './Header';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';
import { reactionOf } from './seen';
import { useInfinite } from './useInfinite';
import { VideoRow } from './VideoRow';

const PAGE = 30;

/** A list of videos you picked out, the latest pick first. */
function MyVideos({
  title,
  note,
  empty,
  picks,
}: {
  title: string;
  note: string;
  empty: string;
  /** Video id to when it was picked. */
  picks: ReadonlyMap<string, number>;
}) {
  const {
    user,
    videoById,
    categoryName,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
    liked,
    disliked,
    react,
  } = useHackerTube();

  const videos = useMemo(
    () =>
      [...picks]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => videoById.get(id))
        .filter(v => v !== undefined),
    [picks, videoById]
  );
  const { visible, sentinel } = useInfinite(videos.length, PAGE);

  return (
    <div className={styles.shell}>
      <SimpleHeader user={user} />
      <div className={styles.page}>
        <BackButton />
        <h1 className={styles.videoTitle}>{title}</h1>
        <Text c="dimmed" size="sm" mb="md">
          {videos.length.toLocaleString()} video{videos.length === 1 ? '' : 's'}
          , latest first. {note}
        </Text>

        {videos.slice(0, visible).map(v => (
          <VideoRow
            key={v.id}
            video={v}
            seen={seen.has(v.id)}
            watchLater={watchLater.has(v.id)}
            categoryNames={v.cats.map(c => categoryName.get(c) ?? c)}
            reaction={reactionOf(v.id, liked, disliked)}
            onReact={react}
            onToggleSeen={markSeen}
            onToggleWatchLater={toggleWatchLater}
          />
        ))}

        {videos.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            {empty}
          </Text>
        )}
        {visible < videos.length && (
          <div ref={sentinel} style={{ height: 1 }} />
        )}
      </div>
    </div>
  );
}

export function LikedPage() {
  const { liked } = useHackerTube();
  return (
    <MyVideos
      title="Liked"
      note="What you like here shapes the For you feed."
      empty="Nothing liked yet. Use the thumbs-up on a video to add it here."
      picks={liked}
    />
  );
}

export function WatchLaterPage() {
  const { watchLater } = useHackerTube();
  return (
    <MyVideos
      title="Watch later"
      note="Taking one off the list is the bookmark on its row."
      empty="Your watch-later list is empty. Use the bookmark on a video to add it."
      picks={watchLater}
    />
  );
}

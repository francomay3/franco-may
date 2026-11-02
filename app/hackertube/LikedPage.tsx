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

/** Everything you liked, the latest like first. */
export function LikedPage() {
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
      [...liked]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => videoById.get(id))
        .filter(v => v !== undefined),
    [liked, videoById]
  );
  const { visible, sentinel } = useInfinite(videos.length, PAGE);

  return (
    <div className={styles.shell}>
      <SimpleHeader user={user} />
      <div className={styles.page}>
        <BackButton />
        <h1 className={styles.videoTitle}>Liked</h1>
        <Text c="dimmed" size="sm" mb="md">
          {videos.length.toLocaleString()} video{videos.length === 1 ? '' : 's'}
          , latest first. What you like here shapes the For you feed.
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
            Nothing liked yet. Use the thumbs-up on a video to add it here.
          </Text>
        )}
        {visible < videos.length && (
          <div ref={sentinel} style={{ height: 1 }} />
        )}
      </div>
    </div>
  );
}

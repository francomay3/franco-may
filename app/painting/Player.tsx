'use client';

import React, { useEffect, useState } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { Text } from '@mantine/core';
import { videoUrl } from './PaintingProvider';
import styles from './painting.module.css';

/**
 * Vidstack's default layout, as in the HackerTube player.
 *
 * Click = play/pause, double-tap the sides = -/+10s, the middle = fullscreen.
 * Keys: space/k play, j/l or the arrows seek, up/down volume, < > speed,
 * f fullscreen, m mute.
 *
 * The video is asked of Storage only now, once the page is already past the
 * gate (see videoUrl for what that URL is). Loaded with ssr:false by the page:
 * it is a web component and a ~100 kB dependency the list never needs.
 */
export default function Player({
  id,
  path,
  title,
  poster,
}: {
  id: string;
  path: string;
  title: string;
  poster: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setSrc(null);
    setFailed(false);
    videoUrl(path).then(
      url => live && setSrc(url),
      () => live && setFailed(true)
    );
    return () => {
      live = false;
    };
  }, [path]);

  if (failed) {
    return (
      <div className={styles.playerLoading}>
        <Text c="dimmed" size="sm">
          This video is not available.
        </Text>
      </div>
    );
  }
  if (!src) {
    return <div className={styles.playerLoading} />;
  }

  return (
    <MediaPlayer
      key={id}
      className={styles.player}
      title={title}
      src={{ src, type: 'video/mp4' }}
      playsInline
      storage="painting-player"
      preload="metadata"
      onError={() => setFailed(true)}
    >
      <MediaProvider>
        <Poster className="vds-poster" src={poster} alt={title} />
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} seekStep={10} />
    </MediaPlayer>
  );
}

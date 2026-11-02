'use client';

import React, { useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import styles from './hackertube.module.css';

/**
 * The same player as the Okrasinski viewer: Vidstack's default layout, here
 * on its YouTube provider so the controls look and behave the same.
 *
 * Click = play/pause, double-tap the sides = -/+10s, the middle = fullscreen.
 * Keys: space/k play, j/l or the arrows seek, up/down volume, < > speed,
 * f fullscreen, m mute.
 *
 * Loaded with ssr:false by the page: it is a web component and a ~100 kB
 * dependency that the list never needs.
 */
export default function Player({
  id,
  title,
  poster,
  onError,
}: {
  id: string;
  title: string;
  poster: string;
  onError: () => void;
}) {
  // Leaving the page destroys the YouTube provider while it still has requests
  // in flight, and each one rejects with this reason after nothing is left to
  // handle it. It is expected and harmless, but it surfaces as an uncaught
  // error, so exactly this one is swallowed. The listener outlives the player
  // by a moment because the rejections arrive after unmount.
  useEffect(() => {
    const swallow = (e: PromiseRejectionEvent) => {
      const reason = e.reason as unknown;
      if (
        reason === 'provider destroyed' ||
        (reason as { message?: string } | null)?.message ===
          'provider destroyed'
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', swallow);
    return () => {
      setTimeout(
        () => window.removeEventListener('unhandledrejection', swallow),
        3000
      );
    };
  }, []);

  return (
    <MediaPlayer
      key={id}
      className={styles.player}
      title={title}
      src={`youtube/${id}`}
      playsInline
      storage="hackertube-player"
      onError={onError}
    >
      <MediaProvider>
        <Poster className="vds-poster" src={poster} alt={title} />
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} seekStep={10} />
    </MediaPlayer>
  );
}

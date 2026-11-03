import React, { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Group, Text } from '@mantine/core';
import { IconThumbUp } from '@tabler/icons-react';
import { channelHref, videoHref } from './channels';
import {
  formatCount,
  formatDate,
  formatDuration,
  midFrame,
  uploaderThumb,
} from './format';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';
import { ReactionButtons } from './ReactionButtons';
import type { Reaction } from './seen';
import type { Video } from './types';

type Props = {
  video: Video;
  seen: boolean;
  watchLater: boolean;
  categoryNames: string[];
  reaction: Reaction | null;
  onReact: (id: string, reaction: Reaction | null) => void;
  /** Title of the liked video this one was suggested because of. */
  because?: string;
  onToggleSeen: (id: string, seen: boolean) => void;
  onToggleWatchLater: (id: string, on: boolean) => void;
};

function VideoRowImpl({
  video,
  seen,
  watchLater,
  categoryNames,
  reaction,
  onReact,
  because,
  onToggleSeen,
  onToggleWatchLater,
}: Props) {
  const router = useRouter();
  const { topPercentOf } = useHackerTube();
  const href = videoHref(video.id);

  // The whole card opens the video page, like a mail row. Real links inside
  // keep middle-click and "copy link" working; the buttons and the channel
  // link are left to do their own thing.
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, [data-noopen]')) {
      return;
    }
    router.push(href);
  };

  return (
    // Keyboard users get the real links inside; the card-wide click is a
    // pointer convenience on top of them.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <article
      className={`${styles.row} ${seen ? styles.seen : styles.unseen}`}
      onClick={handleClick}
    >
      <div className={styles.thumb}>
        <Link href={href} tabIndex={-1}>
          <img
            src={midFrame(video.id)}
            alt=""
            loading="lazy"
            onError={e => {
              const img = e.currentTarget;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = uploaderThumb(video.id);
              }
            }}
          />
        </Link>
        {video.duration !== null && (
          <span className={styles.duration}>
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <Link className={styles.title} href={href}>
          {video.title}
        </Link>
        <div className={styles.meta}>
          {video.channelId ? (
            <Link
              href={channelHref(video.channelId)}
              className={styles.channelLink}
            >
              {video.channel}
            </Link>
          ) : (
            <span>{video.channel}</span>
          )}
          {video.published && <span>{formatDate(video.published)}</span>}
          <span>{formatCount(video.views)} views</span>
          {video.likes !== null && (
            <span>{formatCount(video.likes)} likes</span>
          )}
          <span>{video.recommenders} HN recommenders</span>
        </div>
        {because && (
          <div className={styles.because}>
            <IconThumbUp size={13} /> Because you liked {because}
          </div>
        )}
        <p className={styles.summary}>{video.summary}</p>
        <div className={styles.why}>{video.whyHn}</div>
        <Group gap={6} mt={8}>
          {categoryNames.map(name => (
            <Badge
              key={name}
              size="sm"
              variant="light"
              color="gray"
              radius="sm"
            >
              {name}
            </Badge>
          ))}
        </Group>
      </div>

      <div className={styles.side}>
        <div
          className={styles.rating}
          title={`HackerTube rating: ${video.score}`}
        >
          {video.score === 0 ? 'Unrated' : `Top ${topPercentOf(video.score)}%`}
        </div>
        <ReactionButtons
          reaction={reaction}
          onReact={r => onReact(video.id, r)}
          watchLater={watchLater}
          onToggleWatchLater={on => onToggleWatchLater(video.id, on)}
          seen={seen}
          onToggleSeen={v => onToggleSeen(video.id, v)}
        />
        <Text size="xs" c="dimmed" className={styles.sideState}>
          {seen ? 'seen' : 'new'}
        </Text>
      </div>
    </article>
  );
}

export const VideoRow = memo(VideoRowImpl);

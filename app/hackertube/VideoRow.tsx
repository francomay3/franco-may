import React, { memo } from 'react';
import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core';
import { IconMail, IconMailOpened } from '@tabler/icons-react';
import {
  formatCount,
  formatDate,
  formatDuration,
  midFrame,
  uploaderThumb,
  youtubeUrl,
} from './format';
import styles from './hackertube.module.css';
import type { Video } from './types';

type Props = {
  video: Video;
  seen: boolean;
  categoryNames: string[];
  onOpen: (id: string) => void;
  onToggleSeen: (id: string, seen: boolean) => void;
};

function VideoRowImpl({
  video,
  seen,
  categoryNames,
  onOpen,
  onToggleSeen,
}: Props) {
  const url = youtubeUrl(video.id);

  // The whole card is the click target, like a mail row. Real anchors inside
  // keep middle-click and "copy link" working; they just also mark it seen.
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-noopen]')) {
      return;
    }
    if (!target.closest('a')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    onOpen(video.id);
  };

  const handleAux = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (e.button === 1 && target.closest('a')) {
      onOpen(video.id);
    }
  };

  return (
    // Keyboard users get the real links inside; the card-wide click is a
    // pointer convenience on top of them.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <article
      className={`${styles.row} ${seen ? styles.seen : styles.unseen}`}
      onClick={handleClick}
      onAuxClick={handleAux}
    >
      <div className={styles.thumb}>
        <a href={url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
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
        </a>
        {video.duration !== null && (
          <span className={styles.duration}>
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <a
          className={styles.title}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {video.title}
        </a>
        <div className={styles.meta}>
          <span>{video.channel}</span>
          {video.published && <span>{formatDate(video.published)}</span>}
          <span>{formatCount(video.views)} views</span>
          {video.likes !== null && (
            <span>{formatCount(video.likes)} likes</span>
          )}
          <span>{video.recommenders} HN recommenders</span>
        </div>
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

      <div className={styles.side} data-noopen>
        <div className={styles.rating} title="HackerTube rating">
          {video.score}
          <small>rating</small>
        </div>
        <Tooltip label={seen ? 'Mark as not seen' : 'Mark as seen'} withArrow>
          <ActionIcon
            variant="subtle"
            color={seen ? 'gray' : 'orange'}
            aria-label={seen ? 'Mark as not seen' : 'Mark as seen'}
            onClick={() => onToggleSeen(video.id, !seen)}
          >
            {seen ? <IconMailOpened size={18} /> : <IconMail size={18} />}
          </ActionIcon>
        </Tooltip>
        <Text size="xs" c="dimmed">
          {seen ? 'seen' : 'new'}
        </Text>
      </div>
    </article>
  );
}

export const VideoRow = memo(VideoRowImpl);

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Text } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { channelHref, videoHref } from './channels';
import { formatDuration, midFrame } from './format';
import styles from './hackertube.module.css';
import type { SimilarChannel } from './similar';
import type { Video } from './types';

/** A titled block on the video and channel pages; renders nothing when empty. */
export function Section({
  title,
  hint,
  action,
  empty,
  collapsible,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  empty: boolean;
  /** Show the first row or so, fading out, with a button to see the rest. */
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  if (empty) {
    return null;
  }
  return (
    <section style={{ marginTop: 28 }}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {hint && (
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
          )}
        </div>
        {action}
      </div>
      {collapsible ? <Collapsible>{children}</Collapsible> : children}
    </section>
  );
}

/**
 * Keeps a long block to about a row and a half, fading to nothing, so the
 * sections below it stay in reach. The button only appears when there is more
 * than that to show.
 */
function Collapsible({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) {
      return;
    }
    const measure = () => {
      // Measured while collapsed only: expanded, nothing overflows by design.
      if (!expanded) {
        setOverflowing(el.scrollHeight > el.clientHeight + 4);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, children]);

  return (
    <>
      <div
        ref={box}
        className={`${expanded ? '' : styles.collapsed} ${
          overflowing && !expanded ? styles.fade : ''
        }`}
      >
        {children}
      </div>
      {(overflowing || expanded) && (
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <Button
            variant="subtle"
            color="gray"
            size="compact-md"
            rightSection={
              expanded ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )
            }
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'Show less' : 'View more'}
          </Button>
        </div>
      )}
    </>
  );
}

/** A row of small video cards, each with an optional line under the title. */
export function MiniVideoGrid({
  videos,
  caption,
}: {
  videos: Video[];
  caption?: (video: Video) => string | undefined;
}) {
  return (
    <div className={styles.miniGrid}>
      {videos.map(v => (
        <Link key={v.id} href={videoHref(v.id)} className={styles.mini}>
          <div className={styles.miniThumb}>
            <img src={midFrame(v.id)} alt="" loading="lazy" />
            {v.duration !== null && (
              <span className={styles.duration}>
                {formatDuration(v.duration)}
              </span>
            )}
          </div>
          <span className={styles.miniTitle}>{v.title}</span>
          <span className={styles.miniCaption}>
            {[v.channel, caption?.(v)].filter(Boolean).join(' · ')}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function ChannelCards({ channels }: { channels: SimilarChannel[] }) {
  return (
    <div className={styles.channelCards}>
      {channels.map(c => (
        <Link
          key={c.id}
          href={channelHref(c.id)}
          className={styles.channelCard}
        >
          <div className={styles.channelAvatarSmall}>
            {c.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.channelCardName}>{c.name}</div>
            <div className={styles.miniCaption}>
              {c.videos} video{c.videos === 1 ? '' : 's'} · avg rating{' '}
              {c.avgRating.toFixed(1)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Button, Group, Text } from '@mantine/core';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconBrandYoutube,
  IconExternalLink,
  IconMail,
  IconMailOpened,
} from '@tabler/icons-react';
import { BackButton } from './BackButton';
import { channelHref, videoHref } from './channels';
import {
  formatCount,
  formatDate,
  formatDuration,
  midFrame,
  uploaderThumb,
  youtubeUrl,
} from './format';
import { SimpleHeader } from './Header';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';

const Player = dynamic(() => import('./Player'), {
  ssr: false,
  loading: () => <div className={styles.playerLoading} />,
});

const MORE_FROM_CHANNEL = 6;

export function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const {
    user,
    data,
    videoById,
    categoryName,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
  } = useHackerTube();
  const video = videoById.get(id);
  const [playerFailed, setPlayerFailed] = useState(false);

  // Opening a video is what marks it seen, whether you got here from the list
  // or from a link. Once per video, so un-marking it here sticks.
  const marked = useRef<string | null>(null);
  useEffect(() => {
    if (video && marked.current !== video.id) {
      marked.current = video.id;
      markSeen(video.id, true);
    }
  }, [video, markSeen]);

  useEffect(() => {
    setPlayerFailed(false);
  }, [id]);

  const fromChannel = useMemo(() => {
    if (!video?.channelId) {
      return { more: [], total: 0 };
    }
    const all = data.videos.filter(
      v => v.channelId === video.channelId && v.id !== video.id
    );
    return {
      more: all.sort((a, b) => b.score - a.score).slice(0, MORE_FROM_CHANNEL),
      total: all.length + 1,
    };
  }, [data.videos, video]);

  if (!video) {
    return (
      <div className={styles.shell}>
        <SimpleHeader user={user} />
        <div className={styles.page}>
          <BackButton />
          <Text size="lg" fw={700} mt="lg">
            Video not found
          </Text>
          <Text c="dimmed">It is not in the HackerTube dataset.</Text>
        </div>
      </div>
    );
  }

  const isSeen = seen.has(video.id);
  const isLater = watchLater.has(video.id);
  const embeddable = video.embeddable !== false && !playerFailed;

  return (
    <div className={styles.shell}>
      <SimpleHeader user={user} />

      <div className={styles.page}>
        <div className={styles.topRow}>
          <BackButton />
          <Button
            component="a"
            href={youtubeUrl(video.id)}
            target="_blank"
            rel="noopener noreferrer"
            color="red"
            leftSection={<IconBrandYoutube size={18} />}
            rightSection={<IconExternalLink size={15} />}
          >
            Open on YouTube
          </Button>
        </div>

        <div className={styles.playerWrap}>
          {embeddable ? (
            <Player
              id={video.id}
              title={video.title}
              poster={midFrame(video.id)}
              onError={() => setPlayerFailed(true)}
            />
          ) : (
            <div className={styles.fallback}>
              <img src={uploaderThumb(video.id)} alt="" />
              <div className={styles.fallbackBody}>
                <Text fw={700} c="white" size="lg">
                  This video can&apos;t be played here
                </Text>
                <Text c="gray.4" size="sm">
                  The uploader doesn&apos;t allow it to be embedded.
                </Text>
                <Button
                  component="a"
                  href={youtubeUrl(video.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  color="red"
                  leftSection={<IconBrandYoutube size={22} />}
                >
                  Watch on YouTube
                </Button>
              </div>
            </div>
          )}
        </div>
        <Text size="xs" c="dimmed" mt={6}>
          Space play/pause · ← → seek · ↑ ↓ volume · &lt; &gt; speed · F
          fullscreen · M mute
        </Text>

        <h1 className={styles.videoTitle}>{video.title}</h1>
        <div className={styles.videoMeta}>
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
          {video.duration !== null && (
            <span>{formatDuration(video.duration)}</span>
          )}
          <span>{formatCount(video.views)} views</span>
          {video.likes !== null && (
            <span>{formatCount(video.likes)} likes</span>
          )}
        </div>

        <Group gap="sm" mt="md" className={styles.actions}>
          <Button
            component="a"
            href={youtubeUrl(video.id)}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            color="red"
            leftSection={<IconBrandYoutube size={22} />}
            rightSection={<IconExternalLink size={18} />}
          >
            Open on YouTube
          </Button>
          <Button
            size="lg"
            color="orange"
            variant={isLater ? 'filled' : 'light'}
            leftSection={
              isLater ? (
                <IconBookmarkFilled size={20} />
              ) : (
                <IconBookmark size={20} />
              )
            }
            onClick={() => toggleWatchLater(video.id, !isLater)}
          >
            {isLater ? 'In watch later' : 'Watch later'}
          </Button>
          <Button
            size="lg"
            color="gray"
            variant="default"
            leftSection={
              isSeen ? <IconMailOpened size={20} /> : <IconMail size={20} />
            }
            onClick={() => markSeen(video.id, !isSeen)}
          >
            {isSeen ? 'Seen' : 'Mark as seen'}
          </Button>
        </Group>

        <div className={styles.cards}>
          <section className={styles.card}>
            <h2>About this video</h2>
            <p>{video.summary}</p>
            <Group gap={6} mt="sm">
              {video.cats.map(c => (
                <Badge
                  key={c}
                  size="sm"
                  variant="light"
                  color="gray"
                  radius="sm"
                >
                  {categoryName.get(c) ?? c}
                </Badge>
              ))}
            </Group>
            {video.tags.length > 0 && (
              <Text size="xs" c="dimmed" mt="sm">
                {video.tags.join(' · ')}
              </Text>
            )}
          </section>

          <section className={styles.card}>
            <h2>Why Hacker News recommends it</h2>
            <p>{video.whyHn}</p>
            <div className={styles.stats} style={{ marginTop: 12 }}>
              <div className={styles.stat}>
                <b>{video.score}</b>
                <span>HackerTube rating</span>
              </div>
              <div className={styles.stat}>
                <b>{video.recommenders}</b>
                <span>HN recommenders</span>
              </div>
            </div>
          </section>
        </div>

        {fromChannel.more.length > 0 && video.channelId && (
          <section style={{ marginTop: 28 }}>
            <Group justify="space-between" mb="sm">
              <h2 className={styles.sectionTitle}>More from {video.channel}</h2>
              <Link
                href={channelHref(video.channelId)}
                className={styles.channelLink}
              >
                See all {fromChannel.total} →
              </Link>
            </Group>
            <div className={styles.miniGrid}>
              {fromChannel.more.map(v => (
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
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

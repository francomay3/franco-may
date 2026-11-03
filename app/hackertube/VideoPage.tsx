'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ActionIcon, Badge, Button, Group, Text, Tooltip } from '@mantine/core';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
  IconBrandYoutube,
  IconExternalLink,
  IconMail,
  IconMailOpened,
} from '@tabler/icons-react';
import { BackButton } from './BackButton';
import { channelHref } from './channels';
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
import { reactionOf } from './seen';
import { coRecommended, similarToVideo } from './similar';
import { MiniVideoGrid, Section } from './SimilarSections';

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
    similarity,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
    liked,
    disliked,
    react,
  } = useHackerTube();
  const video = videoById.get(id);
  const [playerFailed, setPlayerFailed] = useState(false);

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

  const similarVideos = useMemo(
    () => (video ? similarToVideo(similarity, video.id) : []),
    [similarity, video]
  );
  const alsoRecommended = useMemo(
    () => (video ? coRecommended(similarity, video.id) : []),
    [similarity, video]
  );

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
  const reaction = reactionOf(video.id, liked, disliked);
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
            onClick={() => markSeen(video.id, true)}
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
                  onClick={() => markSeen(video.id, true)}
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
        <Group gap={6} wrap="nowrap" mt="sm">
          <Tooltip label={reaction === 'like' ? 'Unlike' : 'Like'} withArrow>
            <ActionIcon
              size="xl"
              radius="md"
              color="orange"
              variant={reaction === 'like' ? 'filled' : 'light'}
              aria-label={reaction === 'like' ? 'Unlike' : 'Like'}
              onClick={() =>
                react(video.id, reaction === 'like' ? null : 'like')
              }
            >
              {reaction === 'like' ? (
                <IconThumbUpFilled size={22} />
              ) : (
                <IconThumbUp size={22} />
              )}
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={
              reaction === 'dislike' ? 'Undo not interested' : 'Not interested'
            }
            withArrow
          >
            <ActionIcon
              size="xl"
              radius="md"
              color="red"
              variant={reaction === 'dislike' ? 'filled' : 'light'}
              aria-label={
                reaction === 'dislike'
                  ? 'Undo not interested'
                  : 'Not interested'
              }
              onClick={() =>
                react(video.id, reaction === 'dislike' ? null : 'dislike')
              }
            >
              {reaction === 'dislike' ? (
                <IconThumbDownFilled size={22} />
              ) : (
                <IconThumbDown size={22} />
              )}
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={isLater ? 'Remove from watch later' : 'Watch later'}
            withArrow
          >
            <ActionIcon
              size="xl"
              radius="md"
              color="orange"
              variant={isLater ? 'filled' : 'light'}
              aria-label={
                isLater ? 'Remove from watch later' : 'Add to watch later'
              }
              onClick={() => toggleWatchLater(video.id, !isLater)}
            >
              {isLater ? (
                <IconBookmarkFilled size={22} />
              ) : (
                <IconBookmark size={22} />
              )}
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={isSeen ? 'Mark as not seen' : 'Mark as seen'}
            withArrow
          >
            <ActionIcon
              size="xl"
              radius="md"
              color="gray"
              variant={isSeen ? 'filled' : 'light'}
              aria-label={isSeen ? 'Mark as not seen' : 'Mark as seen'}
              onClick={() => markSeen(video.id, !isSeen)}
            >
              {isSeen ? <IconMailOpened size={22} /> : <IconMail size={22} />}
            </ActionIcon>
          </Tooltip>
        </Group>

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

        <Section
          title={`More from ${video.channel}`}
          action={
            video.channelId && (
              <Link
                href={channelHref(video.channelId)}
                className={styles.channelLink}
              >
                See all {fromChannel.total} →
              </Link>
            )
          }
          empty={fromChannel.more.length === 0 || !video.channelId}
        >
          <MiniVideoGrid videos={fromChannel.more} />
        </Section>

        <Section
          title="Similar videos"
          hint="Close in topic, from other channels"
          empty={similarVideos.length === 0}
        >
          <MiniVideoGrid videos={similarVideos} />
        </Section>

        <Section
          title="Hacker News readers also recommended"
          hint="Recommended by the same commenters"
          empty={alsoRecommended.length === 0}
        >
          <MiniVideoGrid
            videos={alsoRecommended.map(r => r.video)}
            caption={v => {
              const shared = alsoRecommended.find(
                r => r.video.id === v.id
              )?.shared;
              return shared
                ? `${shared} shared recommender${shared === 1 ? '' : 's'}`
                : undefined;
            }}
          />
        </Section>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge, Button, Group, Select, Text } from '@mantine/core';
import { IconBrandYoutube, IconExternalLink } from '@tabler/icons-react';
import { BackButton } from './BackButton';
import { channelStats, youtubeChannelUrl } from './channels';
import { formatCount } from './format';
import { SimpleHeader } from './Header';
import styles from './hackertube.module.css';
import { useHackerTube } from './HackerTubeProvider';
import { VideoRow } from './VideoRow';

type Sort = 'rating' | 'newest' | 'oldest' | 'views';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most viewed' },
];

const PAGE = 30;

export function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const {
    user,
    data,
    categoryName,
    seen,
    markSeen,
    watchLater,
    toggleWatchLater,
  } = useHackerTube();
  const [sort, setSort] = useState<Sort>('rating');
  const [visible, setVisible] = useState(PAGE);

  const videos = useMemo(
    () => data.videos.filter(v => v.channelId === id),
    [data.videos, id]
  );
  const stats = useMemo(() => channelStats(videos), [videos]);

  const sorted = useMemo(() => {
    const out = [...videos];
    switch (sort) {
      case 'newest':
        return out.sort((a, b) =>
          (b.published ?? '').localeCompare(a.published ?? '')
        );
      case 'oldest':
        return out.sort((a, b) =>
          (a.published ?? '9').localeCompare(b.published ?? '9')
        );
      case 'views':
        return out.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      default:
        return out.sort((a, b) => b.score - a.score);
    }
  }, [videos, sort]);

  if (videos.length === 0) {
    return (
      <div className={styles.shell}>
        <SimpleHeader user={user} />
        <div className={styles.page}>
          <BackButton />
          <Text size="lg" fw={700} mt="lg">
            Channel not found
          </Text>
          <Text c="dimmed">
            None of its videos are in the HackerTube dataset.
          </Text>
        </div>
      </div>
    );
  }

  const years =
    stats.firstYear === null
      ? '–'
      : stats.firstYear === stats.lastYear
        ? String(stats.firstYear)
        : `${stats.firstYear}–${stats.lastYear}`;

  return (
    <div className={styles.shell}>
      <SimpleHeader user={user} />

      <div className={styles.page}>
        <BackButton />

        <div className={styles.channelHead}>
          <div className={styles.channelAvatar}>
            {stats.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className={styles.videoTitle} style={{ margin: 0 }}>
              {stats.name}
            </h1>
            <Text c="dimmed" size="sm">
              {stats.videos} video{stats.videos === 1 ? '' : 's'} Hacker News
              recommends
            </Text>
          </div>
          <Button
            component="a"
            href={youtubeChannelUrl(id)}
            target="_blank"
            rel="noopener noreferrer"
            color="red"
            leftSection={<IconBrandYoutube size={20} />}
            rightSection={<IconExternalLink size={16} />}
          >
            Channel on YouTube
          </Button>
        </div>

        <div className={styles.stats} style={{ marginTop: 16 }}>
          <div className={styles.stat}>
            <b>{stats.videos}</b>
            <span>videos here</span>
          </div>
          <div className={styles.stat}>
            <b>{stats.recommenders}</b>
            <span>HN recommenders</span>
          </div>
          <div className={styles.stat}>
            <b>{stats.avgRating.toFixed(1)}</b>
            <span>avg rating</span>
          </div>
          <div className={styles.stat}>
            <b>{stats.bestRating}</b>
            <span>best rating</span>
          </div>
          <div className={styles.stat}>
            <b>{formatCount(stats.views)}</b>
            <span>total views</span>
          </div>
          <div className={styles.stat}>
            <b>{years}</b>
            <span>uploaded</span>
          </div>
        </div>

        {stats.topCategories.length > 0 && (
          <Group gap={6} mt="md">
            {stats.topCategories.map(c => (
              <Badge
                key={c.id}
                size="md"
                variant="light"
                color="orange"
                radius="sm"
              >
                {categoryName.get(c.id) ?? c.id} · {c.count}
              </Badge>
            ))}
          </Group>
        )}

        <Group justify="space-between" mt="xl" mb="sm">
          <h2 className={styles.sectionTitle}>Videos</h2>
          <Select
            size="xs"
            w={150}
            allowDeselect={false}
            value={sort}
            onChange={v => {
              setSort((v ?? 'rating') as Sort);
              setVisible(PAGE);
            }}
            data={SORTS}
            aria-label="Sort"
          />
        </Group>

        {sorted.slice(0, visible).map(v => (
          <VideoRow
            key={v.id}
            video={v}
            seen={seen.has(v.id)}
            watchLater={watchLater.has(v.id)}
            categoryNames={v.cats.map(c => categoryName.get(c) ?? c)}
            onToggleSeen={markSeen}
            onToggleWatchLater={toggleWatchLater}
          />
        ))}

        {visible < sorted.length && (
          <Button
            variant="default"
            fullWidth
            onClick={() => setVisible(n => n + PAGE)}
          >
            Show more ({sorted.length - visible} left)
          </Button>
        )}
      </div>
    </div>
  );
}

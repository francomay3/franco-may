'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import {
  Anchor,
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Typography,
} from '@mantine/core';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import { formatDate, formatDuration } from './format';
import { usePainting } from './PaintingProvider';
import { PlayerPlaceholder } from './PlayerPlaceholder';
import { Slot } from './Slot';

const Player = dynamic(() => import('./Player'), {
  ssr: false,
  loading: () => <PlayerPlaceholder />,
});

export function PostView() {
  const { id } = useParams<{ id: string }>();
  const { library } = usePainting();
  const post = library.posts[id];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <Text>
        Post not found.{' '}
        <Anchor component={Link} href="/painting">
          Back
        </Anchor>
      </Text>
    );
  }
  const series = post.series ? library.series[post.series] : null;

  return (
    <Stack gap="md">
      <Anchor component={Link} href="/painting" size="sm" c="dimmed">
        ← All tutorials
      </Anchor>
      <Box>
        <PageTitle>{post.title}</PageTitle>
        <Group justify="center" gap="md">
          <Text c="dimmed" size="sm">
            {formatDate(post.date)}
          </Text>
          <Text c="dimmed" size="sm">
            {formatDuration(post.duration)}
          </Text>
        </Group>
      </Box>

      {series && (
        <Group gap="xs">
          <Text c="dimmed" size="sm">
            {series.title}
          </Text>
          {series.parts.map((p, i) => (
            <Button
              key={p}
              component={Link}
              href={`/painting/post/${p}`}
              size="compact-sm"
              radius="xl"
              variant={p === id ? 'filled' : 'default'}
            >
              Part {i + 1}
            </Button>
          ))}
        </Group>
      )}

      <Player
        id={post.id}
        path={post.video}
        title={post.title}
        poster={post.posterFull}
      />

      {/* Patreon's own HTML; scripts, inline handlers and links to Patreon were removed when it was built. */}
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </Typography>

      {post.gallery.length > 0 && (
        <>
          <Title order={3}>Images</Title>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
            {post.gallery.map(g => (
              <a key={g.name} href={g.full} target="_blank" rel="noreferrer">
                <Slot
                  src={g.thumb}
                  label={g.name}
                  alt={g.name}
                  caption={g.name.replace(/\.[^.]+$/, '')}
                />
              </a>
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}

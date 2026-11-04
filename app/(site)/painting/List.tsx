'use client';

import React, { useEffect } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import { formatDate, formatDuration } from './format';
import { usePainting } from './PaintingProvider';
import { Slot } from './Slot';
import type { ListItem } from './types';

const SCROLL_KEY = 'painting-list-scroll';

function Row({ item }: { item: ListItem }) {
  const { library } = usePainting();
  const first = item.kind === 'series' ? item.parts![0] : item.id;
  const href = `/painting/post/${first}`;
  const parts = item.parts?.map(p => library.posts[p]);
  const total = parts
    ? parts.reduce((a, p) => a + p.duration, 0)
    : library.posts[item.id].duration;

  return (
    <Card withBorder padding="md">
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--mantine-spacing-md)',
          alignItems: 'start',
        }}
      >
        <Link href={href}>
          <Slot
            src={item.reference}
            label="Reference"
            alt={`${item.title} reference`}
          />
        </Link>
        <Link href={href}>
          <Slot
            src={item.final}
            label="Painting"
            alt={`${item.title} painting`}
          />
        </Link>
        <Stack gap="xs" style={{ gridColumn: 'span 1' }}>
          <Title order={3}>
            <Anchor component={Link} href={href} inherit>
              {item.title}
            </Anchor>
          </Title>
          <Group gap="xs">
            {item.kind === 'series' && (
              <Badge variant="light">{parts!.length}-part series</Badge>
            )}
            <Text c="dimmed" size="sm">
              {formatDate(item.date)}
            </Text>
            <Text c="dimmed" size="sm">
              {formatDuration(total)}
            </Text>
          </Group>
          <Text size="sm" lineClamp={7} style={{ whiteSpace: 'pre-line' }}>
            {item.summary}
          </Text>
        </Stack>
      </Box>

      {parts && (
        <Stack
          gap="xs"
          mt="md"
          pl="md"
          style={{
            borderLeft: '3px solid var(--mantine-primary-color-filled)',
          }}
        >
          {parts.map((p, i) => (
            <Anchor
              key={p.id}
              component={Link}
              href={`/painting/post/${p.id}`}
              c="inherit"
            >
              <Group wrap="nowrap" gap="sm">
                <Image
                  src={p.poster}
                  alt=""
                  w={128}
                  loading="lazy"
                  radius="sm"
                  style={{ flex: 'none', aspectRatio: '16 / 9' }}
                />
                <div>
                  <Text fw={600}>{p.title}</Text>
                  <Text c="dimmed" size="sm">
                    Part {i + 1} · {formatDate(p.date)} ·{' '}
                    {formatDuration(p.duration)}
                  </Text>
                </div>
              </Group>
            </Anchor>
          ))}
        </Stack>
      )}
    </Card>
  );
}

export function List() {
  const { library } = usePainting();

  // Coming back from a tutorial lands where the list was left.
  useEffect(() => {
    window.scrollTo(0, Number(sessionStorage.getItem(SCROLL_KEY) ?? 0));
    const save = () =>
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  return (
    <Box>
      <PageTitle>Painting</PageTitle>
      <Stack gap="md">
        {library.items.map(item => (
          <Row key={item.id} item={item} />
        ))}
      </Stack>
    </Box>
  );
}

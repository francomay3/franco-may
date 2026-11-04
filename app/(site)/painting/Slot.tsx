import React from 'react';
import { Box, Image, Stack, Text } from '@mantine/core';

/** One image, or a dashed box saying which one is missing. */
export function Slot({
  src,
  label,
  alt,
  caption,
}: {
  src: string | null;
  label: string;
  alt: string;
  /** A line of text under the image. */
  caption?: string;
}) {
  return (
    <Stack gap={4}>
      {src ? (
        <Image src={src} alt={alt} loading="lazy" radius="sm" fit="contain" />
      ) : (
        <Box
          style={{
            aspectRatio: '4 / 3',
            display: 'grid',
            placeItems: 'center',
            border: '1px dashed var(--mantine-color-dimmed)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          <Text c="dimmed" size="sm">
            No {label.toLowerCase()} image
          </Text>
        </Box>
      )}
      {caption && (
        <Text c="dimmed" size="xs" tt="uppercase">
          {caption}
        </Text>
      )}
    </Stack>
  );
}

import React from 'react';
import { AspectRatio, Loader } from '@mantine/core';

/** The 16:9 box the player will fill; shows a spinner, or what it is given. */
export function PlayerPlaceholder({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <AspectRatio
      ratio={16 / 9}
      bg="dark.9"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {children ?? <Loader size="sm" />}
    </AspectRatio>
  );
}

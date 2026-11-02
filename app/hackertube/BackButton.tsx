'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { LIST_HREF } from './Header';

/** Back to wherever you came from, or the list if this was opened directly. */
export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="subtle"
      color="gray"
      size="compact-sm"
      leftSection={<IconArrowLeft size={16} />}
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push(LIST_HREF)
      }
    >
      {label}
    </Button>
  );
}

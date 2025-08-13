'use client';

import { useEffect, useState } from 'react';
import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSun, IconMoon, IconLoader2 } from '@tabler/icons-react';

export function ColorSchemeIcon() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ActionIcon
      color={
        mounted
          ? computedColorScheme === 'dark'
            ? 'orange'
            : 'indigo'
          : 'gray'
      }
      variant="subtle"
      onClick={toggleColorScheme}
      title="Toggle color scheme"
    >
      {mounted ? (
        computedColorScheme === 'light' ? (
          <IconMoon size={18} />
        ) : (
          <IconSun size={18} />
        )
      ) : (
        <IconLoader2 size={18} className="animate-spin" />
      )}
    </ActionIcon>
  );
}

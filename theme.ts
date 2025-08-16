'use client';

import { Anchor, Container, createTheme } from '@mantine/core';

export const theme = createTheme({
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        underline: 'never',
      },
    }),
    Container: Container.extend({
      defaultProps: {
        py: 'md',
      },
    }),
  },
});

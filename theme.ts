'use client';

import { Anchor, createTheme } from '@mantine/core';

export const theme = createTheme({
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        underline: 'never',
      },
    }),
  },
});

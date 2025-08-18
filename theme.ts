'use client';

import { Anchor, Button, Container, createTheme, NavLink } from '@mantine/core';

export const theme = createTheme({
  headings: {
    fontFamily: 'Poppins',
  },
  fontFamily: 'Source Serif 4',
  components: {
    Button: Button.extend({
      defaultProps: {
        styles: {
          label: {
            fontFamily: 'var(--mantine-font-family-headings)',
          },
        },
      },
    }),
    NavLink: NavLink.extend({
      defaultProps: {
        styles: {
          label: {
            fontFamily: 'var(--mantine-font-family-headings)',
          },
        },
      },
    }),
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

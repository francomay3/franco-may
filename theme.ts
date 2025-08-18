'use client';

import { Anchor, Button, Container, createTheme, NavLink } from '@mantine/core';

export const theme = createTheme({
  headings: {
    fontFamily: 'Poppins',
    sizes: {
      h1: {
        fontSize: 'calc(1.75rem * var(--mantine-scale))',
      },
      h2: {
        fontSize: 'calc(1.5rem * var(--mantine-scale))',
      },
      h3: {
        fontSize: 'calc(1.25rem * var(--mantine-scale))',
      },
      h4: {
        fontSize: 'calc(1.1rem * var(--mantine-scale))',
      },
      h5: {
        fontSize: 'calc(1rem * var(--mantine-scale))',
      },
      h6: {
        fontSize: 'calc(0.9rem * var(--mantine-scale))',
      },
    },
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

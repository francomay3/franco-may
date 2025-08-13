'use client';

import { createTheme } from '@mantine/core';
import styles from './styles.module.css';

export const theme = createTheme({
  /* Put your mantine theme override here */
  components: {
    Title: {
      defaultProps: {
        className: styles.titles,
      },
    },
    Text: {
      defaultProps: {
        className: styles.text,
      },
    },
  },
});

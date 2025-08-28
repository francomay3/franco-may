import '@mantine/core/styles.css';
import './globals.css';

import React from 'react';
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from '@mantine/core';
import { theme } from '../theme';
import { AppShellWrapper } from '../components/AppShellWrapper/AppShellWrapper';
import { SITE_CONFIG } from '@/utils/constants';
import { Poppins, Source_Serif_4 } from 'next/font/google';
import { QueryProvider } from '@/components/QueryProvider';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400'],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata = {
  title: 'Franco May - Personal Website',
  description: 'A place to share my thoughts and projects.',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      // className={`${poppins.className} ${sourceSerif.className}`}
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪐</text></svg>"
        />
        <ColorSchemeScript />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={SITE_CONFIG.name}
          href={SITE_CONFIG.rssUrl}
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <QueryProvider>
            <AppShellWrapper>{children}</AppShellWrapper>
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}

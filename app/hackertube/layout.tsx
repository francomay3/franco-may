import React from 'react';
import type { Metadata } from 'next';
import { HackerTubeProvider } from './HackerTubeProvider';

// The rest of the site keeps the planet. This segment replaces it with the
// HT mark: the H follows the theme, the T is the same orange as "Tube".
export const metadata: Metadata = {
  icons: {
    icon: {
      url: '/hackertube/icon.svg',
      type: 'image/svg+xml',
    },
  },
};

// The provider sits in the layout so sign-in, the dataset and the person's own
// state are kept while moving between the list, a video and a channel.
export default function HackerTubeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HackerTubeProvider>{children}</HackerTubeProvider>;
}

import React from 'react';
import type { Metadata } from 'next';
import { WatchLaterPage } from '../MyVideos';

export const metadata: Metadata = {
  title: 'Watch later · HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WatchLaterPage />;
}

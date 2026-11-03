import React from 'react';
import type { Metadata } from 'next';
import { LikedPage } from '../MyVideos';

export const metadata: Metadata = {
  title: 'Liked · HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LikedPage />;
}

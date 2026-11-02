import React from 'react';
import type { Metadata } from 'next';
import { VideoPage } from '../../VideoPage';

export const metadata: Metadata = {
  title: 'Video · HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VideoPage />;
}

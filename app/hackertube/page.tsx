import React from 'react';
import type { Metadata } from 'next';
import { HackerTube } from './HackerTube';

export const metadata: Metadata = {
  title: 'HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HackerTube />;
}

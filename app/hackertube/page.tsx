import React from 'react';
import type { Metadata } from 'next';
import { Browser } from './HackerTube';

export const metadata: Metadata = {
  title: 'HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Browser />;
}

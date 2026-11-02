import React from 'react';
import type { Metadata } from 'next';
import { Browser } from '../HackerTube';

export const metadata: Metadata = {
  title: 'Advanced search · HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Browser />;
}

import React from 'react';
import type { Metadata } from 'next';
import { ForYou } from './ForYou';

export const metadata: Metadata = {
  title: 'HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForYou />;
}

import React from 'react';
import type { Metadata } from 'next';
import { PostView } from '../../PostView';

export const metadata: Metadata = {
  title: 'Tutorial · Painting',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PostView />;
}

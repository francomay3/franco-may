import React from 'react';
import type { Metadata } from 'next';
import { ChannelPage } from '../../ChannelPage';

export const metadata: Metadata = {
  title: 'Channel · HackerTube',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ChannelPage />;
}

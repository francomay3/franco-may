import React from 'react';
import { HackerTubeProvider } from './HackerTubeProvider';

// The provider sits in the layout so sign-in, the dataset and the person's own
// state are kept while moving between the list, a video and a channel.
export default function HackerTubeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HackerTubeProvider>{children}</HackerTubeProvider>;
}

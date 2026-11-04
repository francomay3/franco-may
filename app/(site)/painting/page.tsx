import React from 'react';
import type { Metadata } from 'next';
import { List } from './List';

export const metadata: Metadata = {
  title: 'Painting',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <List />;
}

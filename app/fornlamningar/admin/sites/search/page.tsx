import { Suspense } from 'react';
import type { Metadata } from 'next';
import Search from './view';

export const metadata: Metadata = { title: 'Search · Fornkoll' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Search />
    </Suspense>
  );
}

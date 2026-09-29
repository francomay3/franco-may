import { Suspense } from 'react';
import type { Metadata } from 'next';
import Sites from './table';

export const metadata: Metadata = { title: 'Sites · Fornkoll' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Sites />
    </Suspense>
  );
}

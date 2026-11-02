import { Suspense } from 'react';
import type { Metadata } from 'next';
import Sites from './table';

export const metadata: Metadata = { title: 'Sites · Historia Kartan' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Sites />
    </Suspense>
  );
}

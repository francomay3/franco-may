import type { Metadata } from 'next';
import Sites from './table';

export const metadata: Metadata = { title: 'Sites · Fornkoll' };

export default function Page() {
  return <Sites />;
}

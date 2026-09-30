import type { Metadata } from 'next';
import Compare from './view';

export const metadata: Metadata = { title: 'Compare · Fornkoll' };

export default function Page() {
  return <Compare />;
}

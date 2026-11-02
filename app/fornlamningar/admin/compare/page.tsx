import type { Metadata } from 'next';
import Compare from './view';

export const metadata: Metadata = { title: 'Compare · Historia Kartan' };

export default function Page() {
  return <Compare />;
}

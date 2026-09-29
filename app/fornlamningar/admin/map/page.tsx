import type { Metadata } from 'next';
import MapPage from './view';

export const metadata: Metadata = { title: 'Map · Fornkoll' };

export default function Page() {
  return <MapPage />;
}

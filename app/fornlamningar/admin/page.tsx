import type { Metadata } from 'next';
import Home from './home';

export const metadata: Metadata = { title: 'Admin · Fornkoll' };

export default function Page() {
  return <Home />;
}

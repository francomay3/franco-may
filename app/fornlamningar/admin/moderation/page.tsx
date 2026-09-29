import type { Metadata } from 'next';
import Feed from './feed';

export const metadata: Metadata = { title: 'Moderation · Fornkoll' };

export default function Page() {
  return <Feed />;
}

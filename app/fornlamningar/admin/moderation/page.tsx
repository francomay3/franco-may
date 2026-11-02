import type { Metadata } from 'next';
import Feed from './feed';

export const metadata: Metadata = { title: 'Moderation · Historia Kartan' };

export default function Page() {
  return <Feed />;
}

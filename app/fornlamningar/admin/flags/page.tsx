import type { Metadata } from 'next';
import { Flags } from './view';

export const metadata: Metadata = { title: 'Flags · Fornkoll' };

export default function Page() {
  return <Flags />;
}

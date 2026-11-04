import type { Metadata } from 'next';
import { ProjectHeader } from '@/components/ProjectHeader';
import { Impasto } from './Impasto';

export const metadata: Metadata = {
  title: 'Impasto',
  description: 'Pull a palette from an image and get paint mixing recipes.',
};

export default function ImpastoPage() {
  return (
    <>
      <ProjectHeader slug="impasto" />
      <Impasto />
    </>
  );
}

import type { Metadata } from 'next';
import { Text } from '@mantine/core';
import { ProjectHeader } from '@/components/ProjectHeader';
import { Gravity } from './Gravity';

export const metadata: Metadata = {
  title: 'Gravity Grid',
  description: 'An n-body gravity simulation you can pan and zoom.',
};

export default function GravityPage() {
  return (
    <>
      <ProjectHeader slug="gravity" />
      <Gravity />
      <Text size="sm" c="dimmed" mt="lg">
        Every body pulls on every other with the inverse-square law, so the cost
        grows with the square of the count. Raise the body count and watch the
        frame rate to feel it. Nearby planets pull hard on each other, so they
        clump and merge into bigger ones; the count above keeps track.
      </Text>
    </>
  );
}

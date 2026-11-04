import type { Metadata } from 'next';
import { Text } from '@mantine/core';
import { ProjectHeader } from '@/components/ProjectHeader';
import { Duel } from './Duel';

export const metadata: Metadata = {
  title: 'Name duels',
  description: 'Vote between names head to head and watch a ranking build.',
};

export default function DuelPage() {
  return (
    <>
      <ProjectHeader slug="duel" />
      <Duel />
      <Text size="sm" c="dimmed" mt="lg" maw={560} mx="auto">
        This is a stripped-down version with a made-up list and no accounts. The
        real app lets friends and family sign in and vote on names for a baby.
        It started with ELO ratings, as in chess, and later moved to a flat
        point per win and loss.
      </Text>
    </>
  );
}

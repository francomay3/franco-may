'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { type Entry, freshEntries, nextPair, ranked, vote } from './ranking';

export function Duel() {
  const [entries, setEntries] = useState<Entry[]>(freshEntries);
  // Random pairs differ between server and client, so pick after mount.
  const [pair, setPair] = useState<[number, number] | null>(null);

  useEffect(() => {
    setPair(nextPair(freshEntries()));
  }, []);

  const choose = (winner: number, loser: number) => {
    const next = vote(entries, winner, loser);
    setEntries(next);
    setPair(nextPair(next));
  };

  const reset = () => {
    const fresh = freshEntries();
    setEntries(fresh);
    setPair(nextPair(fresh));
  };

  const total = entries.reduce((sum, e) => sum + e.wins, 0);

  return (
    <Stack gap="lg" maw={560} mx="auto">
      <Text ta="center">Which name do you like more?</Text>

      <SimpleGrid cols={2} spacing="md">
        {pair?.map((index, k) => (
          <Card
            key={index}
            withBorder
            p="xl"
            component="button"
            type="button"
            onClick={() => choose(index, pair[1 - k])}
            style={{ cursor: 'pointer', textAlign: 'center' }}
          >
            <Title order={2}>{entries[index].name}</Title>
          </Card>
        )) ?? <Card withBorder p="xl" h={100} />}
      </SimpleGrid>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {total} {total === 1 ? 'vote' : 'votes'}. A win is +1, a loss is −1.
        </Text>
        <Button variant="subtle" onClick={reset}>
          Start over
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th ta="right">Score</Table.Th>
            <Table.Th ta="right">W–L</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {ranked(entries).map((entry, i) => (
            <Table.Tr key={entry.name}>
              <Table.Td>{i + 1}</Table.Td>
              <Table.Td>{entry.name}</Table.Td>
              <Table.Td ta="right">{entry.score}</Table.Td>
              <Table.Td ta="right">
                {entry.wins}–{entry.losses}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

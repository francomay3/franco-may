export type Entry = {
  name: string;
  score: number;
  wins: number;
  losses: number;
};

export const NAMES = [
  'Alma',
  'Bruno',
  'Clara',
  'Dante',
  'Elsa',
  'Felix',
  'Greta',
  'Hugo',
  'Iris',
  'Jonas',
  'Kai',
  'Luna',
];

export const freshEntries = (): Entry[] =>
  NAMES.map(name => ({ name, score: 0, wins: 0, losses: 0 }));

const played = (e: Entry) => e.wins + e.losses;

/** The two names that have been compared least, so everyone gets a turn. */
export function nextPair(entries: Entry[]): [number, number] {
  const order = entries
    .map((entry, index) => ({ index, n: played(entry), r: Math.random() }))
    .sort((a, b) => a.n - b.n || a.r - b.r);
  return [order[0].index, order[1].index];
}

/** A win is +1 and a loss is -1, as in the app. */
export function vote(entries: Entry[], winner: number, loser: number): Entry[] {
  return entries.map((entry, i) =>
    i === winner
      ? { ...entry, score: entry.score + 1, wins: entry.wins + 1 }
      : i === loser
        ? { ...entry, score: entry.score - 1, losses: entry.losses + 1 }
        : entry
  );
}

export const ranked = (entries: Entry[]) =>
  [...entries].sort(
    (a, b) =>
      b.score - a.score || b.wins - a.wins || a.name.localeCompare(b.name)
  );

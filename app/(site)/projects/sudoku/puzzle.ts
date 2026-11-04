export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';

export const DIFFICULTIES: Difficulty[] = [
  'Easy',
  'Medium',
  'Hard',
  'Expert',
  'Master',
];

/** The puzzles from the original app, row by row, with "." for a blank. */
const BASE: Record<Difficulty, string> = {
  Easy: '.14....62.6.42..85.2.5.1....5....4......96..3..37.521.276..45..13..57..99456...27',
  Medium:
    '178...493.4........9.34....78....6.2....1687.9.6..7....67..3.544...9.7.1.....42..',
  Hard: '7.....9..43...6..1..6....7....9....8.9568........5...7........4.12...68...4538...',
  Expert:
    '.2....913..5....87...19....1..68..7..9......2..4...........1.2.8......4...64.3...',
  Master:
    '.3.18..54.....4...7.......9.8.25..1.....6......3...8...2...6........3.4...942...5',
};

export type Cell = {
  value: number | null;
  preset: boolean;
  notes: number[];
};

export type Board = Cell[];

const shuffle = <T>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** A random order of 0-8 that only moves rows within their band of three. */
const bandOrder = () =>
  shuffle([0, 1, 2]).flatMap(band =>
    shuffle([0, 1, 2]).map(offset => band * 3 + offset)
  );

/**
 * The base puzzle with its bands, rows, columns and digits shuffled, and
 * maybe flipped on its diagonal. None of that changes whether it is valid.
 */
export function newBoard(difficulty: Difficulty): Board {
  const rows = bandOrder();
  const columns = bandOrder();
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const transpose = Math.random() < 0.5;

  const board: Board = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const [sr, sc] = transpose
        ? [columns[c], rows[r]]
        : [rows[r], columns[c]];
      const char = BASE[difficulty][sr * 9 + sc];
      board.push({
        value: char === '.' ? null : digits[Number(char) - 1],
        preset: char !== '.',
        notes: [],
      });
    }
  }
  return board;
}

/** Indexes of every cell that shares a row, column or box with another equal one. */
export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  const units: number[][] = [];
  for (let i = 0; i < 9; i++) {
    units.push(Array.from({ length: 9 }, (_, k) => i * 9 + k));
    units.push(Array.from({ length: 9 }, (_, k) => k * 9 + i));
    const [br, bc] = [Math.floor(i / 3) * 3, (i % 3) * 3];
    units.push(
      Array.from(
        { length: 9 },
        (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3)
      )
    );
  }
  for (const unit of units) {
    const seen = new Map<number, number>();
    for (const index of unit) {
      const value = board[index].value;
      if (value === null) {
        continue;
      }
      const earlier = seen.get(value);
      if (earlier !== undefined) {
        conflicts.add(earlier);
        conflicts.add(index);
      }
      seen.set(value, index);
    }
  }
  return conflicts;
}

export const isSolved = (board: Board) =>
  board.every(cell => cell.value !== null) && findConflicts(board).size === 0;

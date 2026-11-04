'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  type Board,
  DIFFICULTIES,
  type Difficulty,
  findConflicts,
  isSolved,
  newBoard,
} from './puzzle';

const LINE = '1px solid var(--mantine-color-default-border)';
const BOX_LINE = '2px solid var(--mantine-color-text)';

const NotesGrid = ({ notes }: { notes: number[] }) => (
  <Box
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      width: '100%',
      height: '100%',
      fontSize: 'clamp(7px, 1.6vw, 11px)',
      lineHeight: 1,
      padding: 2,
    }}
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
      <span key={n} style={{ textAlign: 'center' }}>
        {notes.includes(n) ? n : ''}
      </span>
    ))}
  </Box>
);

export function Sudoku() {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  // Starts empty and fills on the client, so the server and client agree.
  const [board, setBoard] = useState<Board | null>(null);
  const [history, setHistory] = useState<Board[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);

  const start = (next: Difficulty) => {
    setDifficulty(next);
    setBoard(newBoard(next));
    setHistory([]);
    setSelected(null);
  };

  useEffect(() => {
    setBoard(newBoard('Easy'));
  }, []);

  const conflicts = useMemo(
    () => (board ? findConflicts(board) : new Set<number>()),
    [board]
  );
  const solved = board ? isSolved(board) : false;

  const change = (edit: (draft: Board) => void) => {
    if (!board || selected === null || board[selected].preset || solved) {
      return;
    }
    const next = board.map(cell => ({ ...cell, notes: [...cell.notes] }));
    edit(next);
    setHistory(h => [...h, board]);
    setBoard(next);
  };

  const enter = (digit: number) =>
    change(draft => {
      const cell = draft[selected!];
      if (notesMode) {
        if (cell.value !== null) {
          return;
        }
        cell.notes = cell.notes.includes(digit)
          ? cell.notes.filter(n => n !== digit)
          : [...cell.notes, digit];
      } else {
        cell.value = cell.value === digit ? null : digit;
        cell.notes = [];
      }
    });

  const erase = () =>
    change(draft => {
      draft[selected!].value = null;
      draft[selected!].notes = [];
    });

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) {
      return;
    }
    setBoard(previous);
    setHistory(h => h.slice(0, -1));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected === null) {
        return;
      }
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const move = moves[e.key];
      if (move) {
        e.preventDefault();
        const row = (Math.floor(selected / 9) + move[0] + 9) % 9;
        const col = ((selected % 9) + move[1] + 9) % 9;
        setSelected(row * 9 + col);
      } else if (e.key >= '1' && e.key <= '9') {
        enter(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        erase();
      } else if (e.key.toLowerCase() === 'n') {
        setNotesMode(m => !m);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectedValue =
    board && selected !== null ? board[selected].value : null;

  return (
    <Stack gap="md" maw={520} mx="auto">
      <SegmentedControl
        fullWidth
        value={difficulty}
        onChange={value => start(value as Difficulty)}
        data={DIFFICULTIES}
      />

      {solved && (
        <Alert color="green" title="Solved">
          Every row, column and box is complete.
        </Alert>
      )}

      <Box
        role="grid"
        aria-label="Sudoku board"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          aspectRatio: '1',
          border: BOX_LINE,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {(board ?? Array.from({ length: 81 }, () => null)).map((cell, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          const isSelected = selected === i;
          const sameValue =
            selectedValue !== null && cell?.value === selectedValue;
          return (
            <UnstyledButton
              key={i}
              role="gridcell"
              aria-label={`Row ${row + 1}, column ${col + 1}${
                cell?.value ? `, ${cell.value}` : ', empty'
              }`}
              onClick={() => setSelected(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight:
                  col === 8 ? 'none' : col % 3 === 2 ? BOX_LINE : LINE,
                borderBottom:
                  row === 8 ? 'none' : row % 3 === 2 ? BOX_LINE : LINE,
                fontSize: 'clamp(16px, 4.5vw, 28px)',
                fontWeight: cell?.preset ? 700 : 400,
                color: conflicts.has(i)
                  ? 'var(--mantine-color-red-6)'
                  : cell?.preset
                    ? 'var(--mantine-color-text)'
                    : 'var(--mantine-color-blue-6)',
                background: isSelected
                  ? 'var(--mantine-color-blue-light-hover)'
                  : sameValue
                    ? 'var(--mantine-color-blue-light)'
                    : conflicts.has(i)
                      ? 'var(--mantine-color-red-light)'
                      : 'transparent',
              }}
            >
              {cell?.value ??
                (cell && cell.notes.length > 0 ? (
                  <NotesGrid notes={cell.notes} />
                ) : (
                  ''
                ))}
            </UnstyledButton>
          );
        })}
      </Box>

      <Group grow>
        <Button
          variant={notesMode ? 'filled' : 'light'}
          onClick={() => setNotesMode(m => !m)}
        >
          Notes {notesMode ? 'on' : 'off'}
        </Button>
        <Button variant="light" onClick={undo} disabled={history.length === 0}>
          Undo
        </Button>
        <Button variant="light" onClick={erase}>
          Erase
        </Button>
      </Group>

      <SimpleGrid cols={9} spacing="xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <Button key={n} px={0} variant="default" onClick={() => enter(n)}>
            {n}
          </Button>
        ))}
      </SimpleGrid>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Select a cell, then type a digit. Arrow keys move, N toggles notes,
          Backspace erases.
        </Text>
        <Button variant="subtle" onClick={() => start(difficulty)}>
          New game
        </Button>
      </Group>
    </Stack>
  );
}

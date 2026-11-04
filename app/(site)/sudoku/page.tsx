import type { Metadata } from 'next';
import { ProjectHeader } from '../ProjectHeader';
import { Sudoku } from './Sudoku';

export const metadata: Metadata = {
  title: 'Sudoku',
  description: 'A sudoku game with notes, undo and live error checking.',
};

export default function SudokuPage() {
  return (
    <>
      <ProjectHeader slug="sudoku" />
      <Sudoku />
    </>
  );
}

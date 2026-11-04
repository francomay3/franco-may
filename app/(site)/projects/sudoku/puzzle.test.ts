import { DIFFICULTIES, findConflicts, isSolved, newBoard } from './puzzle';

describe('sudoku puzzle', () => {
  it.each(DIFFICULTIES)(
    'a new %s board starts without conflicts',
    difficulty => {
      for (let i = 0; i < 20; i++) {
        expect(findConflicts(newBoard(difficulty)).size).toBe(0);
      }
    }
  );

  it('marks both cells of a duplicate in a row', () => {
    const board = newBoard('Easy');
    board[0].value = 5;
    board[1].value = 5;
    const conflicts = findConflicts(board);
    expect(conflicts.has(0)).toBe(true);
    expect(conflicts.has(1)).toBe(true);
  });

  it('is not solved while cells are empty', () => {
    expect(isSolved(newBoard('Easy'))).toBe(false);
  });
});

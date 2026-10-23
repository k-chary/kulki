import { BOARD_SIZE, type Board } from './board';
import type { Color } from './color';

const LETTERS: Record<string, Color> = {
  r: 'red',
  o: 'orange',
  y: 'yellow',
  g: 'green',
  b: 'blue',
  p: 'purple',
};

/**
 * Test helper: builds a board from nine rows of nine characters, `.` for an
 * empty square and r, o, y, g, b, p for a ball. Whitespace is ignored.
 */
export function parseBoard(text: string): Board {
  const rows = text
    .trim()
    .split('\n')
    .map((row) => row.replace(/\s/g, ''));
  if (rows.length !== BOARD_SIZE || rows.some((row) => row.length !== BOARD_SIZE)) {
    throw new Error(`Board must be ${BOARD_SIZE} rows of ${BOARD_SIZE} squares`);
  }
  return rows.flatMap((row) =>
    [...row].map((char) => {
      if (char === '.') return null;
      const color = LETTERS[char];
      if (!color) throw new Error(`Unknown square "${char}"`);
      return color;
    }),
  );
}

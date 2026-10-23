import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  CELL_COUNT,
  cellAt,
  cellIndex,
  emptyBoard,
  emptyCells,
  getBall,
  isFull,
  isInside,
  neighbors,
  sameCell,
  setBall,
} from './board';
import { parseBoard } from './testing';

describe('board', () => {
  it('starts as 81 empty squares', () => {
    const board = emptyBoard();
    expect(BOARD_SIZE).toBe(9);
    expect(board).toHaveLength(CELL_COUNT);
    expect(emptyCells(board)).toHaveLength(81);
    expect(isFull(board)).toBe(false);
  });

  it('knows which cells are inside', () => {
    expect(isInside({ row: 0, col: 0 })).toBe(true);
    expect(isInside({ row: 8, col: 8 })).toBe(true);
    expect(isInside({ row: -1, col: 0 })).toBe(false);
    expect(isInside({ row: 9, col: 0 })).toBe(false);
    expect(isInside({ row: 0, col: -1 })).toBe(false);
    expect(isInside({ row: 0, col: 9 })).toBe(false);
    expect(isInside({ row: 0.5, col: 0 })).toBe(false);
    expect(isInside({ row: 0, col: 0.5 })).toBe(false);
  });

  it('maps cells to row-major indexes and back', () => {
    expect(cellIndex({ row: 0, col: 0 })).toBe(0);
    expect(cellIndex({ row: 1, col: 2 })).toBe(11);
    expect(cellIndex({ row: 8, col: 8 })).toBe(80);
    for (let index = 0; index < CELL_COUNT; index++) {
      expect(cellIndex(cellAt(index))).toBe(index);
    }
  });

  it('rejects cells and indexes outside the board', () => {
    expect(() => cellIndex({ row: 9, col: 0 })).toThrow(RangeError);
    expect(() => cellAt(-1)).toThrow(RangeError);
    expect(() => cellAt(81)).toThrow(RangeError);
    expect(() => cellAt(1.5)).toThrow(RangeError);
  });

  it('compares cells by position', () => {
    expect(sameCell({ row: 2, col: 3 }, { row: 2, col: 3 })).toBe(true);
    expect(sameCell({ row: 2, col: 3 }, { row: 3, col: 2 })).toBe(false);
    expect(sameCell({ row: 2, col: 3 }, { row: 2, col: 4 })).toBe(false);
  });

  it('sets and clears balls without changing the original board', () => {
    const empty = emptyBoard();
    const cell = { row: 4, col: 5 };
    const withBall = setBall(empty, cell, 'blue');
    expect(getBall(withBall, cell)).toBe('blue');
    expect(getBall(empty, cell)).toBeNull();
    expect(getBall(setBall(withBall, cell, null), cell)).toBeNull();
    expect(emptyCells(withBall)).toHaveLength(80);
    expect(emptyCells(withBall)).not.toContainEqual(cell);
  });

  it('lists empty cells in row-major order and detects a full board', () => {
    const board = parseBoard(`
      rrrrrrrrr
      ooooooooo
      yyyyyyyyy
      ggggggggg
      bbbbbbbbb
      ppppppppp
      rrrrrrrrr
      ooooooooo
      yyyy.yyy.
    `);
    expect(emptyCells(board)).toEqual([
      { row: 8, col: 4 },
      { row: 8, col: 8 },
    ]);
    expect(isFull(board)).toBe(false);
    const full = setBall(setBall(board, { row: 8, col: 4 }, 'red'), { row: 8, col: 8 }, 'red');
    expect(isFull(full)).toBe(true);
    expect(emptyCells(full)).toEqual([]);
  });

  it('lists orthogonal neighbors up, right, down, left', () => {
    expect(neighbors({ row: 4, col: 4 })).toEqual([
      { row: 3, col: 4 },
      { row: 4, col: 5 },
      { row: 5, col: 4 },
      { row: 4, col: 3 },
    ]);
    expect(neighbors({ row: 0, col: 0 })).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]);
    expect(neighbors({ row: 8, col: 4 })).toEqual([
      { row: 7, col: 4 },
      { row: 8, col: 5 },
      { row: 8, col: 3 },
    ]);
  });
});

describe('parseBoard', () => {
  it('rejects malformed boards', () => {
    expect(() => parseBoard('...')).toThrow('9 rows');
    expect(() => parseBoard(Array(9).fill('........x').join('\n'))).toThrow('Unknown square');
  });
});

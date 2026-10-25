import { describe, expect, it } from 'vitest';
import { CLASSIC_COLORS, COLOR_COUNTS, COLORS, colorsFor } from './color';

describe('colorsFor', () => {
  it('gives the classic six for six colors', () => {
    expect([...colorsFor(6)].sort()).toEqual([...CLASSIC_COLORS].sort());
  });

  it('adds pink, white and black for seven to nine', () => {
    expect(colorsFor(7).at(-1)).toBe('pink');
    expect(colorsFor(8).at(-1)).toBe('white');
    expect(colorsFor(9)).toEqual(COLORS);
  });

  it('drops orange in the smallest game', () => {
    expect(colorsFor(5)).toEqual(['red', 'yellow', 'green', 'blue', 'purple']);
  });

  it('offers 5 to 9 and rejects anything else', () => {
    expect(COLOR_COUNTS).toEqual([5, 6, 7, 8, 9]);
    for (const count of [4, 10, 6.5, NaN]) expect(() => colorsFor(count)).toThrow(RangeError);
  });
});

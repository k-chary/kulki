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

  it('keeps red, yellow, green and blue in the smallest game', () => {
    expect(colorsFor(4)).toEqual(['red', 'yellow', 'green', 'blue']);
  });

  it('offers 4 to 9 and rejects anything else', () => {
    expect(COLOR_COUNTS).toEqual([4, 5, 6, 7, 8, 9]);
    for (const count of [3, 10, 6.5, NaN]) expect(() => colorsFor(count)).toThrow(RangeError);
  });
});

import { describe, expect, it } from 'vitest';
import {
  chipStep,
  formatBonus,
  formatBonusDetail,
  formatCleared,
  formatDate,
  formatNumber,
  plural,
} from '.';

const nb = ' ';

describe('plural', () => {
  it.each([
    [0, 'kulek zbitych'],
    [1, 'kulka zbita'],
    [2, 'kulki zbite'],
    [3, 'kulki zbite'],
    [4, 'kulki zbite'],
    [5, 'kulek zbitych'],
    [12, 'kulek zbitych'],
    [13, 'kulek zbitych'],
    [21, 'kulek zbitych'],
    [22, 'kulki zbite'],
    [23, 'kulki zbite'],
    [24, 'kulki zbite'],
    [25, 'kulek zbitych'],
    [112, 'kulek zbitych'],
    [122, 'kulki zbite'],
  ])('%i → %s', (count, words) => {
    expect(plural(count, 'kulka zbita', 'kulki zbite', 'kulek zbitych')).toBe(words);
  });

  it('formats the cleared count with the number grouped', () => {
    expect(formatCleared(1)).toBe('1 kulka zbita');
    expect(formatCleared(124)).toBe('124 kulki zbite');
    expect(formatCleared(1283)).toBe(`1${nb}283 kulki zbite`);
  });
});

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1240, `1${nb}240`],
    [12830, `12${nb}830`],
    [1234567, `1${nb}234${nb}567`],
  ])('%i → %s', (value, text) => {
    expect(formatNumber(value)).toBe(text);
  });

  it('keeps the sign of negative numbers', () => {
    expect(formatNumber(-1240)).toBe(`-1${nb}240`);
  });
});

describe('formatDate', () => {
  it('pads day and month', () => {
    expect(formatDate(new Date(2026, 0, 5, 12).toISOString())).toBe('05.01.2026');
  });

  it('uses the local calendar day', () => {
    expect(formatDate(new Date(2026, 9, 18, 23, 30).toISOString())).toBe('18.10.2026');
  });

  it('rejects text that is not a date', () => {
    expect(() => formatDate('wczoraj')).toThrow();
  });
});

describe('chipStep', () => {
  it('stays plain without a bonus', () => {
    expect(chipStep(5, 0)).toBe(0);
    expect(chipStep(9, 0)).toBe(0);
  });

  it('grows with the balls of one clear', () => {
    expect(chipStep(6, 20)).toBe(1);
    expect(chipStep(8, 90)).toBe(1);
    expect(chipStep(9, 100)).toBe(2);
    expect(chipStep(12, 280)).toBe(2);
    expect(chipStep(13, 360)).toBe(3);
    expect(chipStep(17, 780)).toBe(3);
  });
});

describe('formatBonusDetail', () => {
  it('names the balls and the bonus', () => {
    expect(formatBonusDetail(9, 100)).toBe('9 kulek · premia +100');
    expect(formatBonusDetail(22, 1530)).toBe('22 kulki · premia +1 530');
  });
});

describe('formatBonus', () => {
  it('names the scoring', () => {
    expect(formatBonus(true)).toBe('z premią');
    expect(formatBonus(false)).toBe('bez premii');
  });
});

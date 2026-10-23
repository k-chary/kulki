import { describe, expect, it } from 'vitest';
import {
  type HighscoreEntry,
  insert,
  livePlace,
  normalizeName,
  placeFor,
  pointsMissing,
  qualifies,
  rowsWithLive,
} from './ranking';

function entry(score: number, name = `Gracz ${score}`): HighscoreEntry {
  return { name, score, date: '2026-10-23T08:00:00.000Z' };
}

/** n entries scoring 10·n down to 10, best first. */
function listOf(n: number): HighscoreEntry[] {
  return Array.from({ length: n }, (_, i) => entry((n - i) * 10));
}

describe('placeFor', () => {
  it('is 1 on an empty list', () => {
    expect(placeFor(0, [])).toBe(1);
    expect(placeFor(500, [])).toBe(1);
  });

  it('puts a higher score above a lower one', () => {
    expect(placeFor(25, [entry(30), entry(20), entry(10)])).toBe(2);
  });

  it('puts a new equal score below every stored score it ties with', () => {
    expect(placeFor(20, [entry(30), entry(20), entry(20), entry(10)])).toBe(4);
  });

  it('counts past 30 when the score does not fit', () => {
    expect(placeFor(5, listOf(30))).toBe(31);
  });
});

describe('qualifies', () => {
  it('always qualifies on an empty list', () => {
    expect(qualifies(0, [])).toBe(true);
  });

  it('always qualifies with 29 entries, even with the lowest score', () => {
    expect(qualifies(0, listOf(29))).toBe(true);
  });

  it('with 30 entries, a score below the 30th does not qualify', () => {
    expect(qualifies(5, listOf(30))).toBe(false);
  });

  it('with 30 entries, a score equal to the 30th does not qualify', () => {
    expect(qualifies(10, listOf(30))).toBe(false);
  });

  it('with 30 entries, a score beating the 30th qualifies', () => {
    expect(qualifies(11, listOf(30))).toBe(true);
  });
});

describe('pointsMissing', () => {
  it('is 0 when the score qualifies', () => {
    expect(pointsMissing(0, [])).toBe(0);
    expect(pointsMissing(0, listOf(29))).toBe(0);
    expect(pointsMissing(11, listOf(30))).toBe(0);
  });

  it('is the points needed to beat the 30th entry', () => {
    // The 30th scores 10, so 11 is the least that enters.
    expect(pointsMissing(0, listOf(30))).toBe(11);
    expect(pointsMissing(10, listOf(30))).toBe(1);
  });
});

describe('insert', () => {
  it('adds the first entry to an empty list', () => {
    expect(insert([], entry(40))).toEqual([entry(40)]);
  });

  it('places a new equal score below the older one', () => {
    const older = entry(20, 'Starszy');
    const newer = entry(20, 'Nowszy');
    expect(insert([entry(30), older, entry(10)], newer)).toEqual([
      entry(30),
      older,
      newer,
      entry(10),
    ]);
  });

  it('grows a list of 29 to 30', () => {
    const list = insert(listOf(29), entry(0));
    expect(list).toHaveLength(30);
    expect(list[29]).toEqual(entry(0));
  });

  it('drops the 30th when a full list gets a better score', () => {
    const list = insert(listOf(30), entry(155, 'Nowy'));
    expect(list).toHaveLength(30);
    expect(list[15]).toEqual(entry(155, 'Nowy'));
    expect(list[29]).toEqual(entry(20));
  });

  it('leaves a full list unchanged for a score equal to the 30th', () => {
    expect(insert(listOf(30), entry(10, 'Nowy'))).toEqual(listOf(30));
  });

  it('does not change the input list', () => {
    const list = listOf(3);
    insert(list, entry(15));
    expect(list).toEqual(listOf(3));
  });
});

describe('normalizeName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeName('  Ola \t\n')).toBe('Ola');
  });

  it('keeps inner spaces', () => {
    expect(normalizeName('Jan Kowalski')).toBe('Jan Kowalski');
  });

  it('turns an empty or whitespace-only name into „Gracz”', () => {
    expect(normalizeName('')).toBe('Gracz');
    expect(normalizeName('   \t ')).toBe('Gracz');
  });

  it('keeps Polish characters', () => {
    expect(normalizeName('Zażółć gęślą jaźń')).toBe('Zażółć gęślą jaźń');
  });

  it('keeps exactly 20 characters and cuts 21 or more', () => {
    expect(normalizeName('a'.repeat(20))).toBe('a'.repeat(20));
    expect(normalizeName('a'.repeat(21))).toBe('a'.repeat(20));
    expect(normalizeName('b'.repeat(50))).toBe('b'.repeat(20));
  });

  it('counts each Polish letter as one character', () => {
    expect(normalizeName('ż'.repeat(25))).toBe('ż'.repeat(20));
  });

  it('counts a decomposed Polish letter as one character', () => {
    const decomposed = 'ż'.repeat(25); // z + combining dot above = ż
    expect(normalizeName(decomposed)).toBe('ż'.repeat(20));
  });

  it('trims after cutting so the name never ends in a space', () => {
    expect(normalizeName(`${'a'.repeat(19)} b`)).toBe('a'.repeat(19));
  });
});

describe('livePlace', () => {
  it('is 1 on an empty list', () => {
    expect(livePlace(0, [])).toBe(1);
  });

  it('is null when the score is outside the top 30', () => {
    expect(livePlace(10, listOf(30))).toBeNull();
  });

  it('moves up as the score grows', () => {
    const list = listOf(30); // 300 down to 10
    expect(livePlace(0, list)).toBeNull();
    expect(livePlace(11, list)).toBe(30);
    expect(livePlace(20, list)).toBe(30);
    expect(livePlace(21, list)).toBe(29);
    expect(livePlace(150, list)).toBe(17);
    expect(livePlace(300, list)).toBe(2);
    expect(livePlace(301, list)).toBe(1);
  });
});

describe('rowsWithLive', () => {
  it('shows only the live row on an empty list', () => {
    expect(rowsWithLive([], 0)).toEqual([{ kind: 'live', place: 1, score: 0 }]);
  });

  it('places the live row below equal scores and renumbers the rows after it', () => {
    const list = [entry(30), entry(20), entry(10)];
    expect(rowsWithLive(list, 20)).toEqual([
      { kind: 'stored', place: 1, entry: entry(30) },
      { kind: 'stored', place: 2, entry: entry(20) },
      { kind: 'live', place: 3, score: 20 },
      { kind: 'stored', place: 4, entry: entry(10) },
    ]);
  });

  it('pushes the 30th stored row out of view when the live row enters', () => {
    const rows = rowsWithLive(listOf(30), 155);
    expect(rows).toHaveLength(30);
    expect(rows[15]).toEqual({ kind: 'live', place: 16, score: 155 });
    expect(rows[29]).toEqual({ kind: 'stored', place: 30, entry: entry(20) });
  });

  it('leaves out the live row when the score is outside the top 30', () => {
    const rows = rowsWithLive(listOf(30), 10);
    expect(rows).toHaveLength(30);
    expect(rows.every((row) => row.kind === 'stored')).toBe(true);
  });
});

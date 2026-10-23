import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readDuration, type StyleSource } from './motion';
import { parseTokens, tokenValues } from './tokenSheet';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const blocks = parseTokens(css);

function styleOf(values: Record<string, string>): StyleSource {
  // getPropertyValue returns custom properties as written, with leading space.
  return { getPropertyValue: (name) => (name in values ? ` ${values[name]}` : '') };
}

function styleFor(context: 'motion' | 'reduced'): StyleSource {
  const values: Record<string, string> = {};
  for (const [name, token] of tokenValues(blocks, 'motion')) values[name] = token.value;
  if (context === 'reduced') {
    for (const [name, token] of tokenValues(blocks, 'reduced')) values[name] = token.value;
  }
  return styleOf(values);
}

describe('readDuration', () => {
  it('parses ms values', () => {
    expect(readDuration('--dur-a', styleOf({ '--dur-a': '220ms' }))).toBe(220);
    expect(readDuration('--dur-a', styleOf({ '--dur-a': '0.5ms' }))).toBe(0.5);
  });

  it('parses s values', () => {
    expect(readDuration('--dur-a', styleOf({ '--dur-a': '0.3s' }))).toBe(300);
    expect(readDuration('--dur-a', styleOf({ '--dur-a': '2s' }))).toBe(2000);
    expect(readDuration('--dur-a', styleOf({ '--dur-a': '.25s' }))).toBe(250);
  });

  it('returns 0 for reduced-motion zero tokens', () => {
    const reduced = tokenValues(blocks, 'reduced');
    const zeros = [...reduced.values()].filter(
      (t) => t.name.startsWith('--dur-') && t.value === '0ms',
    );
    expect(zeros.length).toBeGreaterThan(0);
    for (const token of zeros) {
      expect(readDuration(token.name, styleFor('reduced'))).toBe(0);
    }
  });

  it('reads every duration token in tokens.css, full and reduced', () => {
    for (const context of ['motion', 'reduced'] as const) {
      for (const name of tokenValues(blocks, 'motion').keys()) {
        if (!name.startsWith('--dur-')) continue;
        expect(readDuration(name, styleFor(context))).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('throws on a missing token', () => {
    expect(() => readDuration('--dur-nope', styleOf({}))).toThrow(
      /Missing motion token --dur-nope/,
    );
  });

  it('throws on a value that is not a duration', () => {
    expect(() => readDuration('--ease-out', styleFor('motion'))).toThrow(/not a duration/);
    expect(() => readDuration('--dur-a', styleOf({ '--dur-a': '40' }))).toThrow(/not a duration/);
  });

  it('throws on a name that is not a custom property', () => {
    expect(() => readDuration('dur-step', styleOf({ 'dur-step': '40ms' }))).toThrow(
      /Not a custom property/,
    );
  });
});

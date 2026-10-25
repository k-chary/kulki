import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTokens, tokenValues } from './tokenSheet';

describe('parseTokens', () => {
  const sample = `
/* Header comment with { braces } */
:root {
  /* Type */
  --font-body: "Plex", sans-serif;
  --text-xs: 12px;   /* labels */

  /* Space */
  --space-1: 4px;
  /* A sentence explains the token below it. */
  --size: min(
    calc(100vh - 4px),
    10px
  );
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --color-bg: #000; }
}
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-bg: #fff; /* window */
}
[data-theme="dark"] { --color-bg: #111; }
[data-motion="reduced"] { --dur-step: 0ms; }
`;
  const blocks = parseTokens(sample);

  it('skips @media blocks and classifies the rest', () => {
    expect(blocks.map((b) => b.context)).toEqual(['base', 'light', 'dark', 'reduced']);
    expect(blocks[1]?.selector).toBe(':root, [data-theme="light"]');
  });

  it('groups tokens under their label comments', () => {
    expect(blocks[0]?.groups.map((g) => g.title)).toEqual(['Type', 'Space']);
    expect(blocks[0]?.groups[0]?.tokens).toEqual([
      { name: '--font-body', value: '"Plex", sans-serif' },
      { name: '--text-xs', value: '12px', note: 'labels' },
    ]);
  });

  it('keeps multi-line values whole and attaches sentence comments to the next token', () => {
    expect(blocks[0]?.groups[1]?.tokens[1]).toEqual({
      name: '--size',
      value: 'min( calc(100vh - 4px), 10px )',
      note: 'A sentence explains the token below it.',
    });
  });

  it('ignores declarations that are not tokens', () => {
    expect([...tokenValues(blocks, 'light').keys()]).toEqual(['--color-bg']);
    expect(tokenValues(blocks, 'light').get('--color-bg')).toEqual({
      name: '--color-bg',
      value: '#fff',
      note: 'window',
    });
  });

  it('returns an empty map for a context the file lacks', () => {
    expect(tokenValues(blocks, 'motion').size).toBe(0);
  });
});

describe('tokens.css', () => {
  const blocks = parseTokens(readFileSync(new URL('./tokens.css', import.meta.url), 'utf8'));
  const light = tokenValues(blocks, 'light');
  const dark = tokenValues(blocks, 'dark');

  it('has every theme and motion block', () => {
    for (const context of ['base', 'motion', 'reduced', 'light', 'dark'] as const) {
      expect(tokenValues(blocks, context).size).toBeGreaterThan(0);
    }
  });

  it('gives every light color a dark value and the other way round', () => {
    expect([...dark.keys()].sort()).toEqual([...light.keys()].sort());
  });

  it('has the nine ball colors in both ball themes', () => {
    const balls = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'white', 'black'];
    const base = tokenValues(blocks, 'base');
    for (const ball of balls) {
      expect(light.has(`--ball-classic-${ball}`)).toBe(true);
      expect(base.has(`--ball-candy-${ball}`)).toBe(true);
    }
  });

  it('only overrides motion tokens that exist in full motion', () => {
    const full = tokenValues(blocks, 'motion');
    for (const name of tokenValues(blocks, 'reduced').keys()) expect(full.has(name)).toBe(true);
  });
});

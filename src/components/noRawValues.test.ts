import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Ball colors reach CSS only through data-color, so TypeScript never holds a hex value (docs/SPEC.md).
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe('components', () => {
  it('hold no hex colors in TypeScript', () => {
    const offenders = sources(import.meta.dirname).filter((file) =>
      /#[0-9a-f]{3,8}\b/i.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

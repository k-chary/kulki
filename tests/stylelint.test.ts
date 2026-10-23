import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

async function lint(name: string) {
  const { results } = await stylelint.lint({ files: fixture(name) });
  const [result] = results;
  if (!result) throw new Error(`No Stylelint result for ${name}`);
  return result.warnings.map((warning) => warning.rule);
}

describe('Stylelint on CSS Modules', () => {
  it('rejects raw colors, sizes, durations and font names', async () => {
    const rules = await lint('raw-values.module.css');
    expect(rules).toContain('color-no-hex');
    expect(rules).toContain('scale-unlimited/declaration-strict-value');
    expect(rules).toContain('unit-disallowed-list');
  });

  it('accepts tokens and keywords', async () => {
    expect(await lint('tokens-only.module.css')).toEqual([]);
  });
});

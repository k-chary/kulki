import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyBump, bumpFor, largest, nextVersion, stamp } from '../scripts/release.ts';

describe('bumpFor', () => {
  it.each([
    ['feat: color count', [], '0.3.0', 'minor'],
    ['feat(ui): color count', [], '1.2.0', 'minor'],
    ['fix: spawn on a full row', [], '0.3.0', 'patch'],
    ['docs: update the README', [], '0.3.0', 'patch'],
    ['Add a new thing', [], '0.3.0', 'patch'],
    ['feat!: new save format', [], '0.3.0', 'minor'],
    ['feat!: new save format', [], '1.0.0', 'major'],
    ['fix(rules)!: scoring', [], '2.0.0', 'major'],
    ['fix: small', ['release:minor'], '0.3.0', 'minor'],
    ['feat: big', ['release:none'], '0.3.0', 'none'],
    ['feat: big', ['bug', 'release:major'], '0.3.0', 'major'],
  ] as const)('%s %j at %s is %s', (title, labels, version, bump) => {
    expect(bumpFor(title, [...labels], version)).toBe(bump);
  });
});

describe('versions', () => {
  it('takes the largest bump', () => {
    expect(largest([])).toBe('none');
    expect(largest(['patch', 'minor', 'none', 'patch'])).toBe('minor');
  });

  it('applies a bump', () => {
    expect(applyBump('0.3.4', 'patch')).toBe('0.3.5');
    expect(applyBump('0.3.4', 'minor')).toBe('0.4.0');
    expect(applyBump('0.3.4', 'major')).toBe('1.0.0');
  });

  it('works out the next version from the merged PRs', () => {
    const lines = ['fix: one\t', 'feat: two\tui,bug', ''];
    expect(nextVersion('0.3.0', lines)).toBe('0.4.0');
    expect(nextVersion('0.3.0', ['chore: tidy\trelease:none'])).toBeNull();
    expect(nextVersion('0.3.0', [])).toBeNull();
  });
});

describe('stamp', () => {
  it('writes the version into the three app files', () => {
    const root = mkdtempSync(join(tmpdir(), 'kulki-stamp-'));
    mkdirSync(join(root, 'src-tauri'));
    writeFileSync(join(root, 'package.json'), '{\n  "name": "kulki",\n  "version": "0.1.0"\n}\n');
    writeFileSync(
      join(root, 'src-tauri/tauri.conf.json'),
      '{\n  "productName": "Kulki",\n  "version": "0.1.0"\n}\n',
    );
    writeFileSync(
      join(root, 'src-tauri/Cargo.toml'),
      '[package]\nname = "kulki"\nversion = "0.1.0"\n\n[dependencies]\nserde = { version = "1" }\n',
    );

    stamp('0.4.2', root);

    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"version": "0.4.2"');
    expect(readFileSync(join(root, 'src-tauri/tauri.conf.json'), 'utf8')).toContain(
      '"version": "0.4.2"',
    );
    const cargo = readFileSync(join(root, 'src-tauri/Cargo.toml'), 'utf8');
    expect(cargo).toContain('version = "0.4.2"');
    expect(cargo).toContain('serde = { version = "1" }');
  });

  it('rejects a version that is not plain', () => {
    expect(() => stamp('latest', '.')).toThrow();
  });
});

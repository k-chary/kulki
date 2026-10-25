// Release helpers for the workflows in .github/workflows. The version lives in git tags;
// `next` works out the next one from merged PRs and `stamp` writes it into the app's
// version files while an installer is built, so the repo's own copies are never committed.
import { readFileSync, writeFileSync } from 'node:fs';

export type Bump = 'major' | 'minor' | 'patch' | 'none';

const ORDER: Bump[] = ['none', 'patch', 'minor', 'major'];

const VERSION = /^v?(\d+)\.(\d+)\.(\d+)$/;

function parse(version: string): [number, number, number] {
  const match = VERSION.exec(version);
  if (!match) throw new Error(`Not a plain version: ${version}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * The bump a PR asks for: a `release:*` label wins, then the title's conventional-commit
 * type (`feat` is minor, a `!` is breaking), and everything else is a patch. While the app
 * is below 1.0, a breaking change bumps the minor; label `release:major` for 1.0.0.
 */
export function bumpFor(title: string, labels: string[], version: string): Bump {
  const label = labels.map((name) => /^release:(major|minor|patch|none)$/.exec(name)?.[1]);
  const chosen = label.find((value) => value !== undefined);
  if (chosen) return chosen as Bump;
  const type = /^(\w+)(\([^)]*\))?(!)?:/.exec(title.trim());
  if (type?.[3]) return parse(version)[0] === 0 ? 'minor' : 'major';
  if (type?.[1]?.toLowerCase() === 'feat') return 'minor';
  return 'patch';
}

export function largest(bumps: Bump[]): Bump {
  return bumps.reduce<Bump>(
    (best, bump) => (ORDER.indexOf(bump) > ORDER.indexOf(best) ? bump : best),
    'none',
  );
}

export function applyBump(version: string, bump: Exclude<Bump, 'none'>): string {
  const [major, minor, patch] = parse(version);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Rewrites the first `"version": "…"` or `version = "…"` of each app version file. */
export function stamp(version: string, root = '.') {
  parse(version);
  const edit = (path: string, pattern: RegExp, replacement: string) => {
    const file = `${root}/${path}`;
    const text = readFileSync(file, 'utf8');
    if (!pattern.test(text)) throw new Error(`No version found in ${path}`);
    writeFileSync(file, text.replace(pattern, replacement));
  };
  edit('package.json', /"version":\s*"[^"]*"/, `"version": "${version}"`);
  edit('src-tauri/tauri.conf.json', /"version":\s*"[^"]*"/, `"version": "${version}"`);
  edit('src-tauri/Cargo.toml', /^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
}

/** Lines of `title<TAB>label,label`, one per merged PR since the last tag. */
export function nextVersion(current: string, lines: string[]): string | null {
  const bumps = lines
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [title = '', labels = ''] = line.split('\t');
      return bumpFor(title, labels.split(',').filter(Boolean), current);
    });
  const bump = largest(bumps);
  return bump === 'none' ? null : applyBump(current, bump);
}

if (import.meta.main) {
  const [command, argument] = process.argv.slice(2);
  if (command === 'next' && argument) {
    const next = nextVersion(argument, readFileSync(0, 'utf8').split('\n'));
    process.stdout.write(next ?? '');
  } else if (command === 'stamp' && argument) {
    stamp(argument.replace(/^v/, ''));
  } else {
    console.error('Usage: release.ts next <current version> < lines | stamp <version>');
    process.exit(1);
  }
}

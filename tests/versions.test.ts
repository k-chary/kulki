import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const packageVersion = (JSON.parse(read('package.json')) as { version: string }).version;
const tauriVersion = (JSON.parse(read('src-tauri/tauri.conf.json')) as { version: string }).version;
// The first `version =` in Cargo.toml is the [package] one.
const cargoVersion = /^version\s*=\s*"([^"]+)"/m.exec(read('src-tauri/Cargo.toml'))?.[1];

describe('release version', () => {
  it('is a plain semver number', () => {
    expect(packageVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('matches in package.json, Cargo.toml and tauri.conf.json', () => {
    expect({ cargoVersion, tauriVersion }).toEqual({
      cargoVersion: packageVersion,
      tauriVersion: packageVersion,
    });
  });
});

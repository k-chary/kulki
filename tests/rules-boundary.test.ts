import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function lint(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error(`No ESLint result for ${filePath}`);
  return result.messages.map((message) => message.ruleId);
}

const insideRules = 'src/rules/fixture.ts';

describe('ESLint boundary for src/rules/', () => {
  it.each([
    ["import { useState } from 'react';\nexport const hook = useState;\n", 'React'],
    [
      "import { createRoot } from 'react-dom/client';\nexport const root = createRoot;\n",
      'React DOM',
    ],
    ["import { invoke } from '@tauri-apps/api/core';\nexport const call = invoke;\n", 'Tauri'],
    ["import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n", 'Node I/O'],
  ])('rejects importing %#: %s', async (code) => {
    expect(await lint(code, insideRules)).toContain('no-restricted-imports');
  });

  it.each([
    'export const title = () => document.title;\n',
    'export const width = () => window.innerWidth;\n',
    'export const save = () => localStorage.clear();\n',
  ])('rejects browser globals: %s', async (code) => {
    expect(await lint(code, insideRules)).toContain('no-restricted-globals');
  });

  it('accepts plain TypeScript', async () => {
    const code = 'export const roll = (max: number) => Math.floor(Math.random() * max);\n';
    expect(await lint(code, insideRules)).toEqual([]);
  });

  it('leaves the rest of src/ alone', async () => {
    expect(await lint('export const title = () => document.title;\n', 'src/App.ts')).toEqual([]);
  });
});

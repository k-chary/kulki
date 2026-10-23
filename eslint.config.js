import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';

const browserOnlyGlobals = Object.keys(globals.browser).filter(
  (name) => !(name in globals.builtin),
);

export default tseslint.config(
  {
    ignores: ['dist', 'storybook-static', 'src-tauri/target', 'src-tauri/gen', 'node_modules'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // The rules module stays plain TypeScript: no React, DOM, Tauri or Node I/O.
    files: ['src/rules/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', '@tauri-apps/*'],
              message: 'src/rules/ must not depend on React or Tauri.',
            },
            { group: ['node:*'], message: 'src/rules/ must not do I/O.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...browserOnlyGlobals.map((name) => ({
          name,
          message: 'src/rules/ must not use the DOM or browser APIs.',
        })),
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
  prettier,
);

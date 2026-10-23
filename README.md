# Kulki

A Lines-style ball puzzle for the desktop, in Polish. Tauri + React + TypeScript, SQLite for highscores and the saved game.

- Spec: [docs/SPEC.md](docs/SPEC.md) — the single source for game rules, behavior and tech decisions.
- Visual design: [Kulki visual design canvas](https://claude.ai/artifact/Rg7LMfMFpU8usuiQCrqQF4). Reference copies of its tokens and component CSS are in [docs/design/](docs/design/).
- Work is tracked as GitHub issues under the `v1` milestone; one PR per issue, reviewed and merged by @k-chary.

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm
- Rust (stable) and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS. On Debian/Ubuntu:
  `sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev`

Then install the JavaScript dependencies:

```sh
npm install
```

## Commands

| Command               | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `npm run tauri dev`   | Runs the desktop app with hot reload (starts Vite on port 1420)  |
| `npm run tauri build` | Builds the installer for the current OS into `src-tauri/target/` |
| `npm run dev`         | Runs only the web frontend in a browser at http://localhost:1420 |
| `npm run build`       | Typechecks and builds the web frontend into `dist/`              |
| `npm run lint`        | ESLint, Stylelint and Prettier check                             |
| `npm run format`      | Formats every file with Prettier                                 |
| `npm run typecheck`   | TypeScript in strict mode, no emit                               |
| `npm test`            | Vitest once (`npm run test:watch` to keep it running)            |

Pull requests run `npm run lint`, `npm run typecheck` and `npm test` in `.github/workflows/pr.yml`. The full suite (component tests, Playwright, `cargo test`) runs only for releases.

## Styling rule

CSS Modules (`*.module.css`) may only use design tokens: no hex or `rgb()` colors, no `px`/`ms` values and no font names. Stylelint enforces this with `declaration-strict-value` plus unit, color and function bans (see `stylelint.config.js`). `tests/stylelint.test.ts` proves it: the fixture `tests/fixtures/raw-values.module.css` must fail and `tests/fixtures/tokens-only.module.css` must pass.

## Layout

- `src/` — React frontend (`src/styles/` holds global CSS; tokens arrive with issue #2)
- `src/rules/` — game rules in plain TypeScript (board, seedable RNG, pathfinding). ESLint forbids React, Tauri, Node and browser APIs there; `tests/rules-boundary.test.ts` proves it
- `src-tauri/` — Tauri shell (Rust); window settings live in `src-tauri/tauri.conf.json`
- `tests/` — tooling tests and fixtures
- `docs/` — spec and design reference

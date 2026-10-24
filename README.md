# Kulki

A Lines-style ball puzzle for the desktop, in Polish. Tauri + React + TypeScript, SQLite for highscores and the saved game.

- Spec: [docs/SPEC.md](docs/SPEC.md) — the single source for game rules, behavior and tech decisions.
- Visual design: [Kulki visual design canvas](https://claude.ai/artifact/Rg7LMfMFpU8usuiQCrqQF4). Reference copies of its tokens and component CSS are in [docs/design/](docs/design/).
- Work is tracked as GitHub issues under the `v1` milestone; one PR per issue, reviewed and merged by @k-chary.

## Prerequisites

- Node.js 26 (see `.nvmrc`; 22 or newer works) and npm
- Rust (stable) and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS. On Debian/Ubuntu:
  `sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev`

Then install the JavaScript dependencies:

```sh
npm install
```

## Commands

| Command                   | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run tauri dev`       | Runs the desktop app with hot reload (starts Vite on port 1420)      |
| `npm run tauri build`     | Builds the installer for the current OS into `src-tauri/target/`     |
| `npm run dev`             | Runs only the web frontend in a browser at http://localhost:1420     |
| `npm run build`           | Typechecks and builds the web frontend into `dist/`                  |
| `npm run build:e2e`       | Builds the web frontend with the e2e test hook (`?seed=`, `?board=`) |
| `npm run e2e`             | Playwright end-to-end tests against that build (builds it first)     |
| `npm run lint`            | ESLint, Stylelint and Prettier check                                 |
| `npm run format`          | Formats every file with Prettier                                     |
| `npm run typecheck`       | TypeScript in strict mode, no emit                                   |
| `npm test`                | Vitest once (`npm run test:watch` to keep it running)                |
| `npm run storybook`       | Storybook at http://localhost:6006 with the Tokens page              |
| `npm run build-storybook` | Builds Storybook into `storybook-static/`                            |

Pull requests run `npm run lint`, `npm run typecheck` and `npm test` in `.github/workflows/pr.yml`. The full suite (Vitest, component tests and Playwright) runs on demand from the Actions tab (`.github/workflows/full-suite.yml`) and for releases. Run `npx playwright install chromium` once before `npm run e2e`.

The e2e build reads `?seed=7` (seeded random generator) and `?board=rrrr...../...&preview=bbb` (nine rows split by `/`; r o y g b p for a ball, `.` for empty) from the URL. The hook exists only in `--mode e2e` and dev builds.

## Releasing

A release is a version tag pushed by hand (agents never tag).

1. Set the same new version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (also run `cargo update -p kulki` or build once so `Cargo.lock` follows). `tests/versions.test.ts` fails if the three differ.
2. Merge that change to `main`, then tag it and push the tag:
   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. `.github/workflows/release.yml` runs the full suite (`full-suite.yml`: lint, typecheck, Vitest and component tests, Playwright, `cargo test`). Only if all of it passes does it build installers for Windows, macOS (Apple silicon and Intel) and Linux and attach them to a **draft** GitHub Release.
4. Open the draft under Releases, check the three installers, and publish it.

To rehearse, push a tag such as `v0.0.1-test` from a throwaway branch and delete the draft release and tag afterwards. A failing test stops the run before any installer is built.

## Updates

The installed app looks for a newer **published** release at launch and every 6 hours. When it finds one, a bar at the top of the window shows „Dostępna nowa wersja X.Y.Z” with „Zainstaluj i uruchom ponownie” (the game is saved after every move, so restarting loses nothing) and „Później”. A failed check (offline, no release yet) shows nothing. The code is in `src/update/` and `src/components/UpdateBanner/`; the Tauri updater plugin reads `latest.json` from the latest GitHub Release (`plugins.updater` in `src-tauri/tauri.conf.json`).

One-time setup, done by the repository owner:

1. Generate a signing key pair (this is separate from OS code signing): `npx tauri signer generate -w ~/.tauri/kulki.key`. Keep the private key file safe; losing it means installed apps can never update again.
2. Put the public key (the content of `~/.tauri/kulki.key.pub`) in `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`, replacing `REPLACE_WITH_UPDATER_PUBLIC_KEY`, and merge that.
3. Add the repository secrets `TAURI_SIGNING_PRIVATE_KEY` (the private key file's content) and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. `release.yml` stops early with a clear error when either is missing.
4. Make the repository public (or at least its releases): the app fetches `latest.json` without a token, so it cannot see a private repository's releases.

`latest.json` only exists on a **published** release, so the banner appears after you publish the draft, not when the tag passes the tests. The first version that can update itself is the first one released with this setup; older installs have to be reinstalled once by hand.

## Styling rule

CSS Modules (`*.module.css`) may only use design tokens: no hex or `rgb()` colors, no `px`/`ms` values and no font names. Stylelint enforces this with `declaration-strict-value` plus unit, color and function bans (see `stylelint.config.js`). `tests/stylelint.test.ts` proves it: the fixture `tests/fixtures/raw-values.module.css` must fail and `tests/fixtures/tokens-only.module.css` must pass.

## Layout

- `src/` — React frontend
  - `src/styles/tokens.css` — the design tokens, the only place raw colors, sizes, fonts and timings live. A verbatim copy of `docs/design/tokens.css`, so Stylelint and Prettier skip it
  - `src/styles/fonts.ts` — bundled Sora, IBM Plex Sans and IBM Plex Mono (latin + latin-ext)
  - `src/styles/motion.ts` — `readDuration('--dur-clear')` reads a motion token in ms for animation sequencing
  - `src/game/` — the game controller (a pure reducer over the rules: selection, hover preview, status line, „Nowa gra” dialog) and the e2e URL hook
  - `src/screen/` — the game screen that assembles the components
  - `src/rules/` — game rules in plain TypeScript (board, seedable RNG, pathfinding). ESLint forbids React, Tauri, Node and browser APIs there; `tests/rules-boundary.test.ts` proves it
  - `src/storybook/` — Storybook frame (Theme and Motion toolbars), the Tokens page and the specimen story
- `.storybook/` — Storybook config
- `src-tauri/` — Tauri shell (Rust); window settings live in `src-tauri/tauri.conf.json`
- `e2e/` — Playwright specs
- `tests/` — tooling tests and fixtures
- `docs/` — spec and design reference

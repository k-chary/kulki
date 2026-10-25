# Kulki

A Lines-style ball puzzle for the desktop, in Polish. Tauri + React + TypeScript, SQLite for highscores and the saved game.

- Spec: [docs/SPEC.md](docs/SPEC.md) — the single source for game rules, behavior and tech decisions.
- Visual design: [Kulki visual design canvas](https://claude.ai/artifact/Rg7LMfMFpU8usuiQCrqQF4). Reference copies of its tokens and component CSS are in [docs/design/](docs/design/).
- Work is tracked as GitHub issues under the `v1` milestone; one PR per issue, reviewed and merged by @k-chary.

## Prerequisites

- Node.js 26 (see `.nvmrc`; 22 or newer works) and npm
- Rust (stable) and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS. On Debian/Ubuntu:
  `sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev librsvg2-dev`

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

The version lives in git tags. Agents never push tags by hand; CI does.

1. **Every PR gets a suggested version** in a comment (`.github/workflows/version-suggestion.yml`), from the PR title: `feat:` is a minor bump, `feat!:` or `fix!:` a breaking one (a minor bump while the app is below 1.0), and anything else a patch. A label overrides the title: `release:major`, `release:minor`, `release:patch` or `release:none` (no tag). Merging is the approval.
2. **Every merge to `main`** runs the full suite (`full-suite.yml`: lint, typecheck, Vitest and component tests, Playwright, `cargo test`) in `.github/workflows/main.yml`. If it passes, the job tags the commit with the next version, taking the largest bump of the PRs merged since the last tag. A failing suite means no tag; the next merge covers it.
3. **The merge also creates a draft GitHub Release** with generated notes, and asks for your approval. The `release` environment (Settings › Environments) has you as a required reviewer, so GitHub sends a push notification to the mobile app: open the run and tap **Review deployments › Approve and deploy**. Ignoring the request skips that version; it expires after 30 days.
4. **After the approval** `release.yml` stamps the tag's version into `package.json`, `Cargo.toml` and `tauri.conf.json` for that build only (the copies on `main` are not updated and can look stale), builds installers for Windows, macOS (Apple silicon and Intel) and Linux, attaches them to the draft release and publishes it. The in-app update banner appears for installed copies once the release is published. If an installer build fails, the release stays a draft.

To build a tag by hand (for example one made before the approval step existed), open **Release** in the Actions tab, press "Run workflow" and type the tag; an empty field means the latest tag.

One-time setup: create the environment `release` under Settings › Environments, tick "Required reviewers" and add yourself. Without it the `gate` job fails and nothing is built.

`node scripts/release.ts next v0.3.0 < prs.tsv` (lines of `title<TAB>labels`) shows what version a set of PRs would produce.

The installers are not code-signed yet, so the first launch shows a warning:

- **Windows:** SmartScreen says “Windows protected your PC”. Click “More info”, then “Run anyway”.
- **macOS:** Gatekeeper refuses an app from an unidentified developer. Right-click Kulki in Applications, choose “Open” and confirm, or allow it under System Settings › Privacy & Security. If macOS says the app is damaged, run `xattr -dr com.apple.quarantine /Applications/Kulki.app`.
- **Linux:** no warning; make the AppImage executable with `chmod +x`.

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
  - `src/styles/tokens.css` — the design tokens, the only place raw colors, sizes, fonts and timings live. Copied from `docs/design/tokens.css` (since then it adds `--banner-height` and `--z-focus`); Stylelint and Prettier skip it
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

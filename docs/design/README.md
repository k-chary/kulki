# Design reference

Copied from the [Kulki visual design canvas](https://claude.ai/artifact/Rg7LMfMFpU8usuiQCrqQF4) on 2026-10-23.

- `tokens.css` — the design tokens. Issue #2 copies it to `src/styles/tokens.css` unchanged; after that, `src/styles/tokens.css` is the live file.
- `kulki.css` — the canvas's component styles. Each block maps to one component's CSS Module. Reference only: modules must use tokens, never raw values.

The canvas wins on look, layout and motion; `docs/SPEC.md` wins on game rules.

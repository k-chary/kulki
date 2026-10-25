# Kulki — Specification

Approved 2026-10-22. Source: https://claude.ai/code/artifact/2c36446e-f3a3-4162-a404-848f60cc73fc

## Overview

Kulki v1 is a single-player desktop game (Tauri) in Polish: move balls on a 9×9 board and line up 5 or more of one color to clear them. It follows the classic Lines rules. The look, layout, motion and components come from the [Kulki visual design](https://claude.ai/artifact/Rg7LMfMFpU8usuiQCrqQF4) canvas, which replaces the earlier design draft. For game rules this spec wins; for how things look and move, the canvas does.

In scope for v1: the full game loop, next-balls preview, current score, a top-30 highscore list, save and resume, and installers for Windows, macOS and Linux. Added after v1: difficulty, chosen as the number of ball colors (5 to 9). Its look (the three new balls and the „Nowa gra” dialog with its color picker) was designed after the canvas, in Storybook, and those stories are its visual reference.

## Game rules

A turn is one move; new balls appear only after a move that clears nothing.

**Board and balls**

- The board is 9×9 = 81 squares; each square holds at most one ball.
- There are 9 colors: czerwony, żółty, zielony, niebieski, fioletowy, pomarańczowy, różowy, brązowy, czarny. Brązowy replaced biały because white balls were hard to see; saved games read their white balls as brown.
- Each game uses 5 to 9 of them, chosen by the player before the game (see Difficulty). The count picks the first colors of that list: 5 is czerwony, żółty, zielony, niebieski and fioletowy; 6 is the classic set; 7 adds różowy, 8 brązowy and 9 czarny.
- Every ball's color is drawn uniformly at random from the game's colors, independently.
- A new game places 5 balls on random squares. Their colors are random and do not come from the preview. If the 5 already form a line, the start is redrawn.
- From the start, the preview ("Następne") shows the colors of the next 3 balls to appear. Their squares are chosen only when they appear.

**Turn order**

1. The player selects a ball and then an empty square.
2. The move is legal only if a path exists through empty squares, stepping up, down, left or right (no diagonals). The ball travels the shortest such path.
3. After the move, every line of 5 or more same-colored balls (horizontal, vertical or either diagonal) clears.
4. If the move cleared at least one line, the turn ends. No new balls appear.
5. If it cleared nothing, the 3 preview balls appear on random empty squares, and a new preview is drawn.
6. Lines completed by the new balls also clear and score. No replacement balls are added for them.
7. If the board is now full, the game ends.

The rules module computes the whole turn at once and returns it as a list of events: the move with its path, each clear with its cells and points, the spawn with its cells and colors, and game over. The game is saved at that moment, before anything animates, and the screen only plays the events back. Closing the window mid-animation therefore never loses or repeats a move.

**Scoring**

- Each cleared ball is worth 10 points, with no bonus for longer lines or several lines.
- When lines cross, all of them clear at once and a shared ball counts once. Two crossing lines of 5 give 90 points.

**Difficulty**

- Fewer colors make lines easier: the color count is the game's difficulty. The default is 6, the classic game.
- Each count has a name, shown under the picker: 5 łatwy, 6 klasyczny, 7 trudny, 8 bardzo trudny, 9 mistrzowski.
- The count is fixed for a whole game. It is part of the game state, the saved game and the highscore entry.
- Scoring is the same for every count: 10 points per ball.

**Game end**

- If fewer than 3 squares are free when balls must appear, only the free squares are filled. Those balls are checked for lines first.
- The game ends only when the board is full. A player cannot get stuck earlier: any empty square has a neighboring ball that can move into it.

## Interaction and animation

The game is played with a mouse; Kulki has one screen, and everything else is a state of it: a selection, an animation or a dialog over the board.

**Selecting and moving**

- Clicking a ball selects it: the field gets a ring and the ball hops. Clicking another ball switches the selection; clicking the selected ball deselects it.
- Hovering a ball when nothing is selected lightens its field and scales the ball to 1.06. Hovering an empty field with nothing selected does nothing.
- With a ball selected, hovering a reachable empty field shows path dots in the ball's color on every square it will pass, and a dashed ring on the target. An unreachable field shows a not-allowed cursor. The preview hides on pointer leave and when the move starts.
- Clicking an unreachable field shakes the ball and shows „Tam nie ma przejścia”. The ball stays selected and no turn passes.

**Choosing the color count**

- The color count is chosen only when a game starts, never during one. Every new game goes through the „Nowa gra” dialog (see Dialogs).
- The dialog opens on the current game's count. The last count played is remembered and used on the next launch when there is no saved game; the very first game uses 6.
- The game in progress always shows its count in the highscore heading („Najlepsze wyniki · 6 kolorów”).

**Status line**

- The header shows one status line: „Kliknij kulkę, aby ją wybrać”, „Wybrana kulka: czerwona · kliknij puste pole”, „Tam nie ma przejścia”, „Wczytano zapisaną grę” or „Koniec gry”.
- One-off messages stay for 2.2 s. During an animation the line is empty.

**Motion**

| Animation | Full | Reduced motion |
| --- | --- | --- |
| Hop, selected ball | 900 ms loop | Off; the ring alone marks it |
| Slide, move | 40 ms per square, linear | Jumps to the target |
| Shake, no path | 320 ms | Off; the status line still says it |
| Clear, line of 5+ | 300 ms fade and shrink to 60% | Fade only, 150 ms |
| Spawn, new balls | 220 ms pop, 60 ms apart, preview refreshes with them | Fade only, 150 ms, all together |
| Score | Counts up over 300 ms; „+N” chip fades over 900 ms | Jumps; the chip still fades |
| Dialog | Scrim fades, card rises 8 px, 180 ms | Appears at once |

- Reduced motion follows the OS setting. Durations are tokens, and the TypeScript sequencing reads them from CSS instead of hard-coding them.
- From the click that starts a move until the last clear or spawn of the turn ends, no ball can be moved. Clicking another ball in that time selects it at once (the selection ring shows) and it can move when the turn ends; a click on an empty field is dropped, not queued. The moving ball, a ball the turn clears and a ball it spawns cannot be selected. While locked, the board shows no hover feedback and „Nowa gra” is disabled. The hop, shake, chip and list scrolling do not lock input.
- Each step ends on its animationend or transitionend event, with a timer fallback at the token duration + 50 ms, so a hidden window cannot stall the game.

**Dialogs**

- Dialogs sit over the board only, never over the rail, so the highscore list stays readable beside them. A scrim dims the board; the card is up to 380 px wide.
- While a dialog is open the board is locked and „Nowa gra” in the rail is disabled. Focus moves into the dialog and returns to „Nowa gra” on close.
- „Nowa gra” (in the rail or in „Koniec gry”) opens the „Nowa gra” dialog: „Liczba kolorów” as a segmented control 5–9, a strip of the colors in play with the level's name, then „Anuluj” and „Zacznij”. „Zacznij” starts a new game with the chosen count.
- After at least one move the dialog also says „Obecna gra ({score} pkt) zostanie utracona.” and „Anuluj” is focused; otherwise „Zacznij” is focused. Esc, a scrim click and „Anuluj” close it with the game and its count untouched.
- Game over shows „Koniec gry” with the final score over the finished board. Its three states are name entry, saved and outside the top 30, described under Persistence.

## Screen layout and UI text

One window shows a header, the board and a side rail as one centered block. The board is the largest square that fits; everything else has a fixed size. All UI text is in Polish; code and docs are in English.

| Area | Polish label | Size | Shows |
| --- | --- | --- | --- |
| Header | — | 40 px tall | Logo „Kulki” with three balls on the left, status line on the right |
| Board | — | Largest square that fits | 9×9 fields in a 6 px frame with 4 px gaps; balls are 80% of a field |
| Score | Wynik | Rail, 280 px wide | Current points and balls cleared, with Polish plural forms (1 kulka zbita, 2–4 kulki zbite, 5 kulek zbitych) |
| Preview | Następne | Three 44 px slots | The next 3 colors, with „pojawią się po ruchu bez zbicia” always visible |
| New game, options | Nowa gra, Opcje | Two 44 px secondary buttons sharing one row | „Nowa gra” restarts, „Opcje” opens the options dialog; both are disabled during animations and dialogs |
| Highscores | Najlepsze wyniki · {n} kolorów | Fills the rest of the rail, scrolls | Top 30 for the current game's color count, with rank, name, date (dd.mm.rrrr) and points |

**Highscore list rows**

- Stored games are striped. The game in progress shows as „Ta gra · teraz” in the accent color at the place it would take, and moves up as the score grows; it is absent if the score would not make the top 30.
- The entry just saved gets an accent ring until the next game starts. The current or saved row is scrolled into view when it changes.
- On first launch the list says „Jeszcze nie ma wyników. Twoja pierwsza gra trafi tutaj.” and shows only the current game.

**Window**

- Opens at 1280×800 centered, with a 696 px board. The smallest window is 880×600, with a 496 px board.
- Later launches restore the last size and position (Tauri window-state plugin).
- Native title bar titled „Kulki”, no menu bar in v1. The page never scrolls; only the highscore list does.
- Text is not selectable except in the name field, and the context menu is off. Text never scales; only the board does.
- Light and dark themes follow the OS.
- Ball colors follow the ball theme chosen in „Opcje” (see below), classic by default.
- Colors are the only way to tell balls apart in v1 (no symbols). Black balls get a light rim on dark fields so they don't melt into the board, and their path dots and target ring turn light grey there. Yellow is light and lemony so it never reads as orange.

**Options („Opcje”)**

- „Opcje” opens a dialog over the board, like „Nowa gra”. It holds settings that change only the look, so it works mid-game and never touches the game or its score.
- „Kolory kulek” picks the ball theme from two cards, each showing all nine balls in its own theme:
  - **Klasyczne** („Spokojne barwy”): the current palette, with its own light and dark values. The default.
  - **Cukierkowe** („Żywe jak draże czekoladowe”): vivid colors as close to M&M's shells as possible, the same in light and dark. The six classic candies (red, orange, yellow, green, blue, brown) plus the limited-edition purple and pink, and a glossy licorice black.
- A picked theme applies at once (the board behind the dialog changes) and is remembered. „Gotowe” (focused), Esc and a scrim click close the dialog.
- The theme changes only how balls look: the rules, saves and highscores never see it.
- The UI never names the brand; the theme is „Cukierkowe”.

## Persistence

One SQLite file in the app's data folder holds the highscores and the unfinished game.

**Highscores**

- Each color count has its own top 30. An entry stores name, score, date and color count; the rail and game over always use the list of the current game's count.
- Scores saved before color counts existed belong to the 6-color list.
- A finished game enters its color count's list if that list has fewer than 30 entries or the score beats the 30th; the 30th then drops off. Equal scores keep the older game higher.
- Game over then opens „Koniec gry” in one of three states:
  - **Name entry** (made the top 30): final score, „{n}. miejsce w najlepszych wynikach”, a „Nowy rekord” badge for place 1, and the field „Twoje imię” with „Zapisz wynik”. The field is prefilled with the last name used, focused and selected, holds up to 20 characters with a counter, and is trimmed. An empty field saves as „Gracz”. The dialog cannot be dismissed; Enter or „Zapisz wynik” saves.
  - **Saved**: „Zapisano jako {name} · {n}. miejsce” and a focused „Nowa gra”.
  - **Outside the top 30**: „Ten wynik nie mieści się w najlepszej trzydziestce. Do 30. miejsca brakuje {x} pkt.” and „Nowa gra”. Nothing is saved.
- If the app is closed while the name dialog is open, the score is saved with the prefilled name, or „Gracz”, so a top-30 game is never lost.

**Settings**

- Next to the last name and last color count, the settings remember the ball theme. It is read before the first paint, with the save, so a candy game never flashes classic balls. A missing or unknown value is classic.

**Save and resume**

- Each turn is saved as soon as the rules module has computed it, before playback: board, score, balls cleared, preview colors and color count. The selected ball is not saved. A save without a color count is a 6-color game.
- On launch the save is read before the first paint. A saved game is restored without animation, nothing selected, with „Wczytano zapisaną grę”. Without one, a new game pops in its 5 balls.
- Game over deletes the save. Confirming „Nowa gra” discards it.
- The finished game's row is inserted (and the list trimmed to 30) the moment the game ends, under the prefilled name or „Gracz”. „Zapisz wynik” renames that row and remembers the name as the next default, so a closed window or a crash never loses the score.

## Architecture and tech stack

The game rules live in plain TypeScript, the UI in React, and Rust only talks to SQLite.

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Shell | Tauri, desktop first (Windows, macOS, Linux) | Window, packaging, installers |
| Game rules | Plain TypeScript module, no UI or I/O code | Board state, pathfinding, line detection, spawning, scoring, game end; takes a seedable random generator |
| UI | React + TypeScript + Vite | Presentational components plus one game screen that wires them to the rules |
| Storage | Rust with SQLite, exposed as Tauri commands | Highscores, save and load of the current game |

The frontend calls storage through one small interface, so the web build used in tests can swap in an in-memory fake. Mobile builds are out of scope for v1 but the stack keeps them possible.

## Design system and components

Every style comes from one tokens file, and every basic piece of the screen is its own presentational component, from day 1.

**Tokens**

- One file, `src/styles/tokens.css`, defines every token as a CSS custom property with light and dark values, exactly as the canvas's tokens.css: interface colors, the 9 ball colors of each ball theme with a rim and path color for black, type, a 4 px spacing grid, radii, shadows, sizes (rail 280, header 40, controls 44, dialog 380) and motion (durations, easings and a reduced column).
- Tokens are named by role, never by value (`--color-text-muted`, not `--gray-500`). Ball colors reach CSS through a `data-color` attribute, so TypeScript never holds a hex value.
- A CSS Module never contains a hex color, px size, ms duration or font name. A Stylelint rule (declaration-strict-value) enforces it in the PR lint step.
- The light theme is the default; dark follows the OS, and `data-theme` forces either for a subtree. Text pairs meet WCAG AA.
- Ball themes: the classic colors are `--ball-classic-*` (light and dark values), the candy ones `--ball-candy-*` (one value for both). Components read only `--ball-<color>` and `--path-<color>`, which `data-ball-theme="classic" | "candy"` on any element points at one theme for its subtree; the app sets it on the root element.

**Typography**

- Sora for the logo and dialog titles, IBM Plex Sans for reading text, IBM Plex Mono with tabular figures for every number that changes.
- Fonts ship inside the bundle via the @fontsource packages (latin-ext subset for Polish), never from Google Fonts, because the app is offline.
- Numbers group thousands with a narrow no-break space: 1 240, 12 830.

**Components**

Each component is presentational: its own CSS Module, every state through props, clicks and hovers reported up, no game logic.

| Group | Components |
| --- | --- |
| Board | Ball, Field (a real button), Board, MovingBall |
| Header | Logo, StatusLine |
| Rail | Panel, ScorePanel, NextBalls, PreviewSlot, ScoreRow, HighscoreList |
| Controls | Button (primary, secondary), TextField, ColorCountPicker, BallThemePicker |
| Dialogs | Dialog (base), NewGameDialog, OptionsDialog, GameOver, NameEntry |

The game screen only assembles these and connects them to the rules module. Props and states for each are drawn on the canvas.

**Storybook**

- Every component has a story for each of its states, rendered on the real background.
- A „Tokens” docs page renders the sheet from tokens.css itself, so it cannot drift.
- The toolbar has a Theme switch (light, dark, side by side), a Motion switch (full, reduced) and a Balls switch (classic, candy).
- A new component or state is not done until its story exists.

## Testing and release

The full test suite gates each release; pull requests get only a quick check of about a minute.

| Suite | Tool | Covers | Runs on |
| --- | --- | --- | --- |
| Rules | Vitest, seeded random generator | Paths, lines in 4 directions, crossing lines, spawning, scoring, game end, start reroll, color counts | Every PR and every release |
| Components | React Testing Library | Presentational components and the click-to-move flow | Every PR and every release |
| End to end | Playwright on the web build, in-memory storage | A full move, a clear, game over, name entry, changing the color count | Release |
| Storage | cargo test | Highscore ranking and trimming, save and load | Release |

Every PR also gets lint and type checks. A release is a git tag such as `v0.1.0`: GitHub Actions runs all suites, and only if they pass builds the Windows, macOS and Linux installers and publishes them as a GitHub Release.

## Repo and workflow

The code lives in a new private GitHub repo, `k-chary/kulki`, with this spec copied to `docs/SPEC.md`.

- Work is split into granular GitHub issues, each delivering a working part of the game.
- Each issue becomes one PR that Harry reviews and merges. Agents never merge.
- The step plan is agreed in a separate thread based on this spec. The first cut is: project setup, tokens and Storybook, rules module, presentational components, game screen and animations, SQLite highscores and save, then Playwright and the release workflow.

## Out of scope for v1

- Mobile builds and touch layouts.
- Symbols on balls for colorblind players.
- Score bonuses, undo, sound and keyboard controls.
- Syncing highscores across devices.

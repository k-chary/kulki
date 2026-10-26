import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board } from '../components/Board/Board';
import { Button } from '../components/Button/Button';
import { GameOver } from '../components/GameOver/GameOver';
import { HighscoreList } from '../components/HighscoreList/HighscoreList';
import { Logo } from '../components/Logo/Logo';
import { NewGameDialog } from '../components/NewGameDialog/NewGameDialog';
import { NextBalls } from '../components/NextBalls/NextBalls';
import { OptionsDialog } from '../components/OptionsDialog/OptionsDialog';
import { ScorePanel } from '../components/ScorePanel/ScorePanel';
import { StatusLine } from '../components/StatusLine/StatusLine';
import {
  type ControllerAction,
  type ControllerState,
  boardView,
  finishedEntry,
  gameOverView,
  highscoreRows,
  initialState,
  isLocked,
  reduce,
  saveEffect,
  selectedColor,
  statusOf,
  withIntro,
} from '../game/controller';
import { type PlaybackView, buildSteps, restingView } from '../game/playback';
import { type Sequence, playSequence } from '../game/sequencer';
import type { BallTheme } from '../format';
import { type HighscoreEntry, rowsWithLive } from '../highscores/ranking';
import { type GameState, type Rng, cellIndex, newGame } from '../rules';
import type { InsertResult, Storage } from '../storage/Storage';
import { readDuration, readTurnDurations } from '../styles/motion';
import styles from './GameScreen.module.css';
import { useCountUp } from './useCountUp';

export interface GameScreenProps {
  storage: Storage<GameState>;
  rng: Rng;
  /** Start from this game instead of a new one (a new game from App, test fixtures). */
  game?: GameState;
  /** Pop the balls of `game` in, as for a new game. Defaults to true without a `game`. */
  intro?: boolean;
  /** `game` was read from the save: shows „Wczytano zapisaną grę” and warns before „Nowa gra”. */
  resumed?: boolean;
  /** The theme saved in „Opcje”; classic when none was picked yet. */
  ballTheme?: BallTheme;
}

/** Storage failures do not stop the game, but they must not go unnoticed. */
function logStorageError(error: unknown): void {
  console.error('Kulki: storage failed', error);
}

/**
 * The controller state with a dispatch that runs the reducer once, in the event that
 * caused it. `reduce` draws from `rng`, so it must not run inside React's render,
 * which StrictMode repeats in development.
 */
function useController(init: () => ControllerState, rng: Rng) {
  const [state, setState] = useState(init);
  const current = useRef(state);
  const dispatch = useCallback(
    (action: ControllerAction) => {
      const next = reduce(current.current, action, rng);
      if (next === current.current) return;
      current.current = next;
      setState(next);
    },
    [rng],
  );
  return [state, dispatch] as const;
}

/** The one screen of Kulki: assembles the components and connects them to the controller. */
export function GameScreen({
  storage,
  rng,
  game,
  intro = game === undefined,
  resumed = false,
  ballTheme: initialTheme = 'classic',
}: GameScreenProps) {
  const [state, dispatch] = useController(() => {
    const start = initialState(game ?? newGame(rng), resumed ? 'loaded' : null, resumed ? 1 : 0);
    // A new game pops its balls in; a fixture or a resumed game appears at once.
    return intro && !resumed ? withIntro(start) : start;
  }, rng);
  // The list before the finished game's own row went in; the dialog and the live row use it.
  // It belongs to one color count; after a new game with another count it reads empty
  // until that count's list is loaded.
  const { colorCount } = state.game;
  const [stored, setStored] = useState<{ colorCount: number; entries: HighscoreEntry[] }>({
    colorCount,
    entries: [],
  });
  const highscores = useMemo(
    () => (stored.colorCount === colorCount ? stored.entries : []),
    [stored, colorCount],
  );
  const setHighscores = useCallback(
    (entries: HighscoreEntry[], forCount: number) => setStored({ colorCount: forCount, entries }),
    [],
  );
  const [lastName, setLastName] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const saving = useRef(false);
  const newGameButton = useRef<HTMLButtonElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [ballTheme, setBallTheme] = useState(initialTheme);
  // Every ball reads the theme from the root element.
  useEffect(() => {
    document.documentElement.dataset.ballTheme = ballTheme;
  }, [ballTheme]);
  const pickBallTheme = (theme: BallTheme) => {
    setBallTheme(theme);
    void storage.setBallTheme(theme).catch(logStorageError);
  };
  const lastNameRef = useRef(lastName);
  useEffect(() => {
    lastNameRef.current = lastName;
  });
  // The row stored when the game ended; „Zapisz wynik” renames it.
  const finished = useRef<Promise<InsertResult> | null>(null);

  useEffect(() => {
    let current = true;
    void Promise.all([storage.listHighscores(colorCount), storage.getLastName()]).then(
      ([list, name]) => {
        if (!current) return;
        setHighscores(list, colorCount);
        setLastName(name);
      },
    );
    return () => {
      current = false;
    };
  }, [storage, colorCount, setHighscores]);

  // Every turn is saved as soon as the reducer has computed it, before anything
  // is played back. The turn that ends the game drops the save and stores the score
  // under the last name at once, so closing the window or a crash cannot lose a
  // top-30 game; a new game deletes the save. Writes run in order.
  const previous = useRef(state);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const effect = saveEffect(previous.current, state);
    previous.current = state;
    if (effect === null) return;
    const after = writes.current.catch(() => undefined);
    if (effect.type === 'save') {
      writes.current = after.then(() => storage.saveGame(effect.game)).catch(logStorageError);
      return;
    }
    if (effect.type === 'delete') {
      finished.current = null;
      setSaveFailed(false);
      writes.current = after.then(() => storage.deleteGame()).catch(logStorageError);
      return;
    }
    const entry = finishedEntry(effect.game, lastNameRef.current, new Date().toISOString());
    const stored = after
      .then(() => storage.deleteGame())
      .then(() => storage.insertHighscore(entry));
    finished.current = stored;
    writes.current = stored
      .then((result) => {
        // The storage kept no row after all: the dialog shows „outside the top 30”.
        if (result.id === null) setHighscores(result.highscores, effect.game.colorCount);
      })
      .catch(logStorageError);
  }, [state, storage, setHighscores]);

  // One-off messages leave the status line after --dur-status.
  const { notice, noticeId } = state;
  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(
      () => dispatch({ type: 'clearNotice', noticeId }),
      readDuration('--dur-status'),
    );
    return () => clearTimeout(timer);
  }, [notice, noticeId, dispatch]);

  // Playback of the turn in progress: each step shows a view until its animation ends.
  const { turn, game: after } = state;
  const durations = useMemo(() => (turn ? readTurnDurations() : null), [turn]);
  const steps = useMemo(
    () => (turn && durations ? buildSteps(turn.before, after, turn.events, durations) : null),
    [turn, durations, after],
  );
  const [progress, setProgress] = useState<{ turn: typeof turn; view: PlaybackView } | null>(null);
  const [chip, setChip] = useState<{ delta: number; id: number } | null>(null);
  const sequence = useRef<Sequence | null>(null);
  const chipCount = useRef(0);

  useEffect(() => {
    if (!turn || !steps) return;
    const running = playSequence(steps, {
      onStep(view) {
        setProgress({ turn, view });
        if (view.delta !== null) {
          chipCount.current += 1;
          setChip({ delta: view.delta, id: chipCount.current });
        }
      },
      onDone: () => dispatch({ type: 'turnDone' }),
    });
    sequence.current = running;
    return () => {
      running.cancel();
      sequence.current = null;
    };
  }, [turn, steps, dispatch]);

  // The no-path shake does not lock input; its end is signalled by the ball or this timer.
  const { shaking } = state;
  useEffect(() => {
    if (!shaking) return;
    const timer = setTimeout(
      () => dispatch({ type: 'shakeEnd' }),
      readDuration('--dur-shake') + 50,
    );
    return () => clearTimeout(timer);
  }, [shaking, state.noticeId, dispatch]);

  const resting = useMemo(() => restingView(after), [after]);
  const view = progress?.turn === turn && progress ? progress.view : (steps?.[0]?.view ?? resting);
  const shownScore = useCountUp(view.score, turn ? (durations?.score ?? 0) : 0);

  const locked = isLocked(state);
  const animating = useMemo(
    () => new Set([...view.clearing, ...view.spawning].map(cellIndex)),
    [view],
  );
  const cells = useMemo(
    () => boardView(state, turn ? view : undefined, durations?.spawnStagger ?? 0),
    [state, turn, view, durations],
  );
  // While a turn plays the live row follows the score on screen; the dialogs wait for its end.
  const rows = useMemo(
    () => (turn ? rowsWithLive(highscores, view.score) : highscoreRows(state, highscores)),
    [state, highscores, turn, view.score],
  );
  // The „Nowa gra” dialog replaces „Koniec gry” while it is open; „Anuluj” brings it back.
  const gameOver = turn || state.choosing ? null : gameOverView(state, highscores, lastName);
  const requestNewGame = () => dispatch({ type: 'requestNewGame' });
  const startNewGame = (count: number) => {
    // Only the next launch depends on it; the game starts regardless.
    void storage.setLastColorCount(count).catch(logStorageError);
    dispatch({ type: 'startNewGame', colorCount: count });
  };

  // Renames the row stored at game over. If storing it failed, the row is inserted
  // now; either way a retry renames, so a score is never stored twice.
  const saveScore = async (name: string) => {
    if (saving.current) return;
    saving.current = true;
    setSaveFailed(false);
    try {
      let result = finished.current ? await finished.current.catch(() => null) : null;
      if (result === null) {
        const entry = {
          name,
          score: state.game.score,
          date: new Date().toISOString(),
          colorCount: state.game.colorCount,
        };
        const inserted = storage.insertHighscore(entry);
        finished.current = inserted;
        result = await inserted;
      }
      if (result.id === null || result.place === null) {
        setHighscores(result.highscores, state.game.colorCount);
        return;
      }
      const list = await storage.renameHighscore(result.id, name);
      setHighscores(list, state.game.colorCount);
      setLastName(name);
      dispatch({ type: 'scoreSaved', name, place: result.place });
      // Only the next default depends on it; the score is already stored.
      void storage.setLastName(name).catch(logStorageError);
    } catch (error) {
      logStorageError(error);
      setSaveFailed(true);
    } finally {
      saving.current = false;
    }
  };
  const status = statusOf(state);
  // „Nowa gra” and „Opcje” are disabled together: during animations and dialogs.
  const railLocked = state.choosing || turn !== null || gameOver !== null || optionsOpen;

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Logo />
        <StatusLine {...status} />
      </header>
      <div className={styles.body}>
        <Board
          cells={cells}
          pathColor={selectedColor(state) ?? undefined}
          locked={locked}
          clickable={turn !== null}
          moving={view.moving ?? undefined}
          onBallAnimationEnd={(cell) => {
            // Only the balls this step clears or spawns end it; a ball picked meanwhile does not.
            if (animating.has(cellIndex(cell))) sequence.current?.signal();
            dispatch({ type: 'shakeEnd' });
          }}
          onMoveStepEnd={() => sequence.current?.signal()}
          onFieldClick={(cell) => dispatch({ type: 'click', cell })}
          onFieldHover={(cell) => dispatch({ type: 'hover', cell })}
        >
          {optionsOpen && (
            <OptionsDialog
              ballTheme={ballTheme}
              onBallThemeChange={pickBallTheme}
              onClose={() => setOptionsOpen(false)}
              returnFocusRef={optionsButton}
            />
          )}
          {state.choosing && (
            <NewGameDialog
              colorCount={colorCount}
              score={state.moves > 0 && !state.game.gameOver ? state.game.score : null}
              returnFocusRef={newGameButton}
              onCancel={() => dispatch({ type: 'cancelNewGame' })}
              onStart={startNewGame}
            />
          )}
          {gameOver?.state === 'entry' && (
            <GameOver
              {...gameOver}
              score={state.game.score}
              returnFocusRef={newGameButton}
              failed={saveFailed}
              onSave={(name) => void saveScore(name)}
            />
          )}
          {gameOver && gameOver.state !== 'entry' && (
            <GameOver
              {...gameOver}
              score={state.game.score}
              returnFocusRef={newGameButton}
              onNewGame={requestNewGame}
            />
          )}
        </Board>
        <aside className={styles.rail}>
          <ScorePanel
            score={view.score}
            shownScore={shownScore}
            cleared={view.cleared}
            delta={chip?.delta}
            deltaId={chip?.id}
          />
          <NextBalls colors={view.preview} fresh={view.spawning.length > 0} />
          <div className={styles.actions}>
            <Button
              ref={newGameButton}
              variant="secondary"
              disabled={railLocked}
              onClick={requestNewGame}
            >
              Nowa gra
            </Button>
            <Button
              ref={optionsButton}
              variant="secondary"
              disabled={railLocked}
              onClick={() => setOptionsOpen(true)}
            >
              Opcje
            </Button>
          </div>
          <HighscoreList
            rows={rows}
            savedPlace={state.saved?.place ?? null}
            colorCount={colorCount}
          />
        </aside>
      </div>
    </main>
  );
}

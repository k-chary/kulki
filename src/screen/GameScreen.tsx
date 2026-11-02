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
import {
  type HighscoreEntry,
  type HighscoreRow,
  livePlace,
  rowsWithLive,
} from '../highscores/ranking';
import {
  type Color,
  type GameState,
  type Rng,
  POINTS_PER_BALL,
  cellIndex,
  emptyCells,
  newGame,
} from '../rules';
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
  /** The color count remembered for the next game (set in „Nowa gra” or „Opcje”); the game's own by default. */
  nextColorCount?: number;
  /** The scoring remembered for the next game (set in „Nowa gra” or „Opcje”); the bonus is off when none was chosen. */
  nextBonus?: boolean;
}

/** One highscore list: a color count and a scoring have their own top 30. */
interface ListOf {
  colorCount: number;
  bonus: boolean;
  entries: HighscoreEntry[];
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
  nextColorCount: initialNextColorCount,
  nextBonus: initialNextBonus = false,
}: GameScreenProps) {
  const [state, dispatch] = useController(() => {
    const start = initialState(game ?? newGame(rng), resumed ? 'loaded' : null, resumed ? 1 : 0);
    // A new game pops its balls in; a fixture or a resumed game appears at once.
    return intro && !resumed ? withIntro(start) : start;
  }, rng);
  // The list before the finished game's own row went in; the dialog and the live row use it.
  // It belongs to one color count and scoring; after a new game with another config it
  // reads empty until that config's list is loaded.
  const { colorCount, bonus } = state.game;
  const [stored, setStored] = useState<ListOf>({ colorCount, bonus, entries: [] });
  const highscores = useMemo(
    () => (stored.colorCount === colorCount && stored.bonus === bonus ? stored.entries : []),
    [stored, colorCount, bonus],
  );
  const setHighscores = useCallback(
    (entries: HighscoreEntry[], forCount: number, forBonus: boolean) =>
      setStored({ colorCount: forCount, bonus: forBonus, entries }),
    [],
  );
  // The count and scoring whose list the rail shows. They follow the game at launch and
  // whenever a game starts or ends; in between the player may browse the other lists.
  // Not stored anywhere.
  const [shown, setShown] = useState(colorCount);
  const [shownBonus, setShownBonus] = useState(bonus);
  const [browsed, setBrowsed] = useState<ListOf>({ colorCount, bonus, entries: [] });
  const [nextColorCount, setNextColorCount] = useState(initialNextColorCount ?? colorCount);
  const [nextBonus, setNextBonus] = useState(initialNextBonus);
  useEffect(() => {
    if (shown === colorCount && shownBonus === bonus) return;
    let current = true;
    void storage
      .listHighscores(shown, shownBonus)
      .then((entries) => {
        // An answer for a list no longer shown is dropped.
        if (current) setBrowsed({ colorCount: shown, bonus: shownBonus, entries });
      })
      .catch(logStorageError);
    return () => {
      current = false;
    };
  }, [storage, shown, shownBonus, colorCount, bonus]);
  const [lastName, setLastName] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const saving = useRef(false);
  const newGameButton = useRef<HTMLButtonElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  // Where „Opcje” was opened from: the rail, or the „Nowa gra” link, which hides
  // „Nowa gra” meanwhile and keeps the count picked there for its return.
  const [options, setOptions] = useState<null | 'rail' | 'newGame'>(null);
  const [pickedCount, setPickedCount] = useState<number | null>(null);
  const optionsOpen = options !== null;
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
    void Promise.all([storage.listHighscores(colorCount, bonus), storage.getLastName()]).then(
      ([list, name]) => {
        if (!current) return;
        setHighscores(list, colorCount, bonus);
        setLastName(name);
      },
    );
    return () => {
      current = false;
    };
  }, [storage, colorCount, bonus, setHighscores]);

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
        if (result.id === null)
          setHighscores(result.highscores, effect.game.colorCount, effect.game.bonus);
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
  const [chip, setChip] = useState<{ delta: number; balls: number; id: number } | null>(null);
  const sequence = useRef<Sequence | null>(null);
  const chipCount = useRef(0);

  useEffect(() => {
    if (!turn || !steps) return;
    const running = playSequence(steps, {
      onStep(view) {
        setProgress({ turn, view });
        if (view.delta !== null) {
          chipCount.current += 1;
          setChip({ delta: view.delta, balls: view.deltaBalls, id: chipCount.current });
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
  // The game's own list is shown again once the game over screen is up.
  const gameEnded = state.game.gameOver && turn === null;
  const [wasEnded, setWasEnded] = useState(gameEnded);
  if (gameEnded !== wasEnded) {
    setWasEnded(gameEnded);
    if (gameEnded) {
      setShown(colorCount);
      setShownBonus(bonus);
    }
  }
  const browsing = shown !== colorCount || shownBonus !== bonus;
  const shownRows: HighscoreRow[] = useMemo(
    () =>
      browsing
        ? (browsed.colorCount === shown && browsed.bonus === shownBonus ? browsed.entries : []).map(
            (entry, i) => ({
              kind: 'stored',
              place: i + 1,
              entry,
            }),
          )
        : rows,
    [browsing, browsed, shown, shownBonus, rows],
  );
  // „Opcje” only remembers the next game's scoring; the game in progress is not touched.
  const changeNextBonus = (next: boolean) => {
    setNextBonus(next);
    void storage.setLastBonus(next).catch(logStorageError);
  };
  const requestNewGame = () => dispatch({ type: 'requestNewGame' });
  const startNewGame = (count: number, withBonus: boolean) => {
    setPickedCount(null);
    // Only the next launch depends on them; the game starts regardless.
    void storage.setLastColorCount(count).catch(logStorageError);
    void storage.setLastBonus(withBonus).catch(logStorageError);
    setNextColorCount(count);
    setNextBonus(withBonus);
    setShown(count);
    setShownBonus(withBonus);
    dispatch({ type: 'startNewGame', colorCount: count, bonus: withBonus });
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
          bonus: state.game.bonus,
        };
        const inserted = storage.insertHighscore(entry);
        finished.current = inserted;
        result = await inserted;
      }
      if (result.id === null || result.place === null) {
        setHighscores(result.highscores, state.game.colorCount, state.game.bonus);
        return;
      }
      const list = await storage.renameHighscore(result.id, name);
      setHighscores(list, state.game.colorCount, state.game.bonus);
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
          {options && (
            <OptionsDialog
              ballTheme={ballTheme}
              onBallThemeChange={pickBallTheme}
              bonus={nextBonus}
              onBonusChange={changeNextBonus}
              onClose={() => setOptions(null)}
              // Back to „Nowa gra”, which takes focus itself, or to the rail.
              returnFocusRef={options === 'rail' ? optionsButton : undefined}
            />
          )}
          {state.choosing && !optionsOpen && (
            <NewGameDialog
              colorCount={pickedCount ?? nextColorCount}
              bonus={nextBonus}
              score={state.moves > 0 && !state.game.gameOver ? state.game.score : null}
              returnFocusRef={newGameButton}
              onCancel={() => {
                setPickedCount(null);
                dispatch({ type: 'cancelNewGame' });
              }}
              onStart={startNewGame}
              onOpenOptions={(count) => {
                setPickedCount(count);
                setOptions('newGame');
              }}
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
            deltaBalls={chip?.balls}
            deltaBonus={chip ? chip.delta - chip.balls * POINTS_PER_BALL : 0}
          />
          <NextBalls colors={fittingPreview(view)} fresh={view.spawning.length > 0} />
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
              onClick={() => setOptions('rail')}
            >
              Opcje
            </Button>
          </div>
          <HighscoreList
            rows={shownRows}
            savedPlace={browsing ? null : (state.saved?.place ?? null)}
            colorCount={shown}
            gameColorCount={colorCount}
            onColorCountChange={setShown}
            bonus={shownBonus}
            gameBonus={bonus}
            onBonusChange={setShownBonus}
            current={
              state.game.gameOver
                ? undefined
                : { place: livePlace(view.score, highscores), score: view.score }
            }
          />
        </aside>
      </div>
    </main>
  );
}

/**
 * The preview balls that will really appear: only as many as there are free
 * squares (the sliding ball's square counts as taken).
 */
function fittingPreview(view: {
  board: GameState['board'];
  moving: unknown;
  preview: readonly Color[];
}) {
  const free = emptyCells(view.board).length - (view.moving ? 1 : 0);
  return view.preview.slice(0, Math.max(free, 0));
}

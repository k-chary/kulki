import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Board } from '../components/Board/Board';
import { Button } from '../components/Button/Button';
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';
import { HighscoreList } from '../components/HighscoreList/HighscoreList';
import { Logo } from '../components/Logo/Logo';
import { NextBalls } from '../components/NextBalls/NextBalls';
import { ScorePanel } from '../components/ScorePanel/ScorePanel';
import { StatusLine } from '../components/StatusLine/StatusLine';
import {
  boardView,
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
import { type HighscoreEntry, rowsWithLive } from '../highscores/ranking';
import { type GameState, type Rng, newGame } from '../rules';
import type { Storage } from '../storage/Storage';
import { readDuration, readTurnDurations } from '../styles/motion';
import styles from './GameScreen.module.css';
import { useCountUp } from './useCountUp';

export interface GameScreenProps {
  storage: Storage<GameState>;
  rng: Rng;
  /** Start from this game instead of a new one (test fixtures). */
  game?: GameState;
  /** `game` was read from the save: shows „Wczytano zapisaną grę” and asks before „Nowa gra”. */
  resumed?: boolean;
}

/** The one screen of Kulki: assembles the components and connects them to the controller. */
export function GameScreen({ storage, rng, game, resumed = false }: GameScreenProps) {
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof initialState>, action: Parameters<typeof reduce>[1]) =>
      reduce(current, action, rng),
    undefined,
    () => {
      const start = initialState(game ?? newGame(rng), resumed ? 'loaded' : null, resumed ? 1 : 0);
      // A fresh game pops its balls in; a fixture or a resumed game appears at once.
      return game === undefined && !resumed ? withIntro(start) : start;
    },
  );
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
  const newGameButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let current = true;
    void storage.listHighscores().then((list) => {
      if (current) setHighscores(list);
    });
    return () => {
      current = false;
    };
  }, [storage]);

  // Every turn is saved as soon as the reducer has computed it, before anything
  // is played back; game over and a new game delete the save. Writes run in order.
  const previous = useRef(state);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const effect = saveEffect(previous.current, state);
    previous.current = state;
    if (effect === null) return;
    const write = () =>
      effect.type === 'save' ? storage.saveGame(effect.game) : storage.deleteGame();
    writes.current = writes.current.then(write).catch(() => undefined);
  }, [state, storage]);

  // One-off messages leave the status line after --dur-status.
  const { notice, noticeId } = state;
  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(
      () => dispatch({ type: 'clearNotice', noticeId }),
      readDuration('--dur-status'),
    );
    return () => clearTimeout(timer);
  }, [notice, noticeId]);

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
  }, [turn, steps]);

  // The no-path shake does not lock input; its end is signalled by the ball or this timer.
  const { shaking } = state;
  useEffect(() => {
    if (!shaking) return;
    const timer = setTimeout(
      () => dispatch({ type: 'shakeEnd' }),
      readDuration('--dur-shake') + 50,
    );
    return () => clearTimeout(timer);
  }, [shaking, state.noticeId]);

  const resting = useMemo(() => restingView(after), [after]);
  const view = progress?.turn === turn && progress ? progress.view : (steps?.[0]?.view ?? resting);
  const shownScore = useCountUp(view.score, turn ? (durations?.score ?? 0) : 0);

  const locked = isLocked(state);
  const cells = useMemo(
    () => boardView(state, turn ? view : undefined, durations?.spawnStagger ?? 0),
    [state, turn, view, durations],
  );
  const liveScore = turn ? view.score : after.score;
  const rows = useMemo(
    () =>
      after.gameOver && !turn ? rowsWithLive(highscores, -1) : rowsWithLive(highscores, liveScore),
    [highscores, liveScore, after.gameOver, turn],
  );
  const status = statusOf(state);

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
          moving={view.moving ?? undefined}
          onBallAnimationEnd={() => {
            sequence.current?.signal();
            dispatch({ type: 'shakeEnd' });
          }}
          onMoveStepEnd={() => sequence.current?.signal()}
          onFieldClick={(cell) => dispatch({ type: 'click', cell })}
          onFieldHover={(cell) => dispatch({ type: 'hover', cell })}
        >
          {state.confirming && (
            <ConfirmDialog
              score={state.game.score}
              returnFocusRef={newGameButton}
              onCancel={() => dispatch({ type: 'cancelNewGame' })}
              onConfirm={() => dispatch({ type: 'confirmNewGame' })}
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
          <Button
            ref={newGameButton}
            variant="secondary"
            block
            disabled={state.confirming || turn !== null}
            onClick={() => dispatch({ type: 'requestNewGame' })}
          >
            Nowa gra
          </Button>
          <HighscoreList rows={rows} />
        </aside>
      </div>
    </main>
  );
}

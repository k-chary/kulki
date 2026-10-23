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
} from '../game/controller';
import { type HighscoreEntry, rowsWithLive } from '../highscores/ranking';
import { type GameState, type Rng, newGame } from '../rules';
import type { Storage } from '../storage/Storage';
import { readDuration } from '../styles/motion';
import styles from './GameScreen.module.css';

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
    () => initialState(game ?? newGame(rng), resumed ? 'loaded' : null, resumed ? 1 : 0),
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

  const locked = isLocked(state);
  const cells = useMemo(() => boardView(state), [state]);
  const rows = useMemo(
    () =>
      state.game.gameOver
        ? rowsWithLive(highscores, -1)
        : rowsWithLive(highscores, state.game.score),
    [highscores, state.game.score, state.game.gameOver],
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
          <ScorePanel score={state.game.score} cleared={state.game.cleared} />
          <NextBalls colors={state.game.preview} />
          <Button
            ref={newGameButton}
            variant="secondary"
            block
            disabled={state.confirming}
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

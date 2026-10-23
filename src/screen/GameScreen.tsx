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
}

/** The one screen of Kulki: assembles the components and connects them to the controller. */
export function GameScreen({ storage, rng, game }: GameScreenProps) {
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof initialState>, action: Parameters<typeof reduce>[1]) =>
      reduce(current, action, rng),
    undefined,
    () => initialState(game ?? newGame(rng)),
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

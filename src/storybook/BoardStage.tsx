import type { ReactNode } from 'react';
import { parseBoard } from '../rules/testing';
import { Board } from '../components/Board/Board';
import styles from './BoardStage.module.css';

// A finished-looking board to dim behind a dialog.
const BACKDROP = parseBoard(`
  rbpgyorbp
  gyorbpgyo
  pgyorbpgy
  orbpgyorb
  bpgyorbpg
  yorbpgyor
  rbpgyorbp
  gyorbpgyo
  pgyorbpgy
`);

/** A board with a dialog over it, as the game screen places one. */
export function BoardStage({ children }: { children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <Board cells={BACKDROP.map((color) => ({ color }))} locked>
        {children}
      </Board>
    </div>
  );
}

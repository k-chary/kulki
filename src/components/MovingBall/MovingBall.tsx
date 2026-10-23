import type { CSSProperties, TransitionEvent } from 'react';
import type { Color } from '../../rules';
import { Ball } from '../Ball/Ball';
import styles from './MovingBall.module.css';

export interface MovingBallProps {
  color: Color;
  /** The square the ball is on now; change it one step at a time. */
  row: number;
  col: number;
  /** Fires when the slide to the current square ends. */
  onStepEnd?: () => void;
}

/**
 * A field-sized layer over the board that carries the moving ball. Each change
 * of row or col slides it one square in --dur-step; it must sit inside Board.
 */
export function MovingBall({ color, row, col, onStepEnd }: MovingBallProps) {
  const style = { '--row': row, '--col': col } as CSSProperties;
  const handleTransitionEnd = onStepEnd
    ? (event: TransitionEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onStepEnd();
      }
    : undefined;
  return (
    <div
      className={styles.moving}
      style={style}
      data-row={row}
      data-col={col}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden="true"
    >
      <Ball color={color} />
    </div>
  );
}

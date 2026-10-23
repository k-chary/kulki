import type { ReactNode } from 'react';
import { cellAt, type Cell, type Color } from '../../rules';
import { Ball, type BallState } from '../Ball/Ball';
import { Field, type FieldState } from '../Field/Field';
import { MovingBall } from '../MovingBall/MovingBall';
import { fieldLabel } from './fieldLabel';
import styles from './Board.module.css';

/** What one square shows; the game screen derives it from the game state. */
export interface CellView {
  color: Color | null;
  state?: FieldState;
  ballState?: BallState;
  /** Spawn stagger for this ball. */
  ballDelayMs?: number;
}

export interface BoardProps {
  /** 81 cells, row-major. */
  cells: readonly CellView[];
  /** The selected ball's color, used for path dots and the target ring. */
  pathColor?: Color;
  /** True while anything animates or a dialog is open: clicks and hovers are dropped. */
  locked?: boolean;
  /** The ball sliding along its path, drawn over the fields. */
  moving?: { color: Color; row: number; col: number };
  onFieldClick?: (cell: Cell) => void;
  /** Called with the hovered field, and with null when the pointer leaves the board. */
  onFieldHover?: (cell: Cell | null) => void;
  /** A ball finished its shake, clear or spawn. */
  onBallAnimationEnd?: (cell: Cell) => void;
  /** The moving ball finished one step. */
  onMoveStepEnd?: () => void;
  /** Dialogs, placed over the board. */
  children?: ReactNode;
}

/** The 9×9 board, sized by --board-size. */
export function Board({
  cells,
  pathColor,
  locked = false,
  moving,
  onFieldClick,
  onFieldHover,
  onBallAnimationEnd,
  onMoveStepEnd,
  children,
}: BoardProps) {
  return (
    <div
      className={styles.board}
      data-path={pathColor}
      data-locked={locked}
      onPointerLeave={locked ? undefined : () => onFieldHover?.(null)}
    >
      {cells.map((view, index) => {
        const cell = cellAt(index);
        const { color } = view;
        return (
          <Field
            key={index}
            row={cell.row}
            col={cell.col}
            state={view.state}
            hasBall={color !== null}
            label={fieldLabel(cell.row, cell.col, color)}
            locked={locked}
            onClick={locked ? undefined : () => onFieldClick?.(cell)}
            onPointerEnter={locked ? undefined : () => onFieldHover?.(cell)}
          >
            {color && (
              <Ball
                color={color}
                state={view.ballState}
                delayMs={view.ballDelayMs}
                onAnimationEnd={onBallAnimationEnd && (() => onBallAnimationEnd(cell))}
              />
            )}
          </Field>
        );
      })}
      {moving && <MovingBall {...moving} onStepEnd={onMoveStepEnd} />}
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import styles from './Field.module.css';

export type FieldState = 'idle' | 'selected' | 'path' | 'target' | 'blocked' | 'clearing';

export interface FieldProps {
  row: number;
  col: number;
  state?: FieldState;
  hasBall: boolean;
  /** Accessible name in Polish, see fieldLabel(). */
  label: string;
  /** No hover feedback and a default cursor while the board is locked. */
  locked?: boolean;
  /** A locked field that still takes a click keeps the pointer cursor. */
  pickable?: boolean;
  /** Storybook only: shows the hover look without a pointer. */
  forceHover?: boolean;
  onClick?: () => void;
  onPointerEnter?: () => void;
  /** The Ball, if any. */
  children?: ReactNode;
}

/** One square of the board: a real button that reports clicks and hovers up. */
export function Field({
  row,
  col,
  state = 'idle',
  hasBall,
  label,
  locked = false,
  pickable = false,
  forceHover = false,
  onClick,
  onPointerEnter,
  children,
}: FieldProps) {
  return (
    <button
      type="button"
      className={styles.field}
      data-row={row}
      data-col={col}
      data-state={state}
      data-ball={hasBall}
      data-locked={locked}
      data-pickable={pickable || undefined}
      data-hover={forceHover || undefined}
      aria-label={label}
      aria-disabled={locked || undefined}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
    >
      {children}
    </button>
  );
}

// Stand-in until the Ball from #7 merges; it keeps the same path, exports and
// props, so whichever PR merges second drops its copy.
import type { Color } from '../../rules/color';
import styles from './Ball.module.css';

export type BallState = 'idle' | 'selected' | 'shake' | 'clearing' | 'spawning';

export interface BallProps {
  color: Color;
  state?: BallState;
  /** Spawn stagger, applied as animation-delay. */
  delayMs?: number;
  onAnimationEnd?: () => void;
  className?: string;
}

export function Ball({ color, state = 'idle', delayMs, onAnimationEnd, className }: BallProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.ball} ${className}` : styles.ball}
      data-color={color}
      data-state={state}
      style={delayMs === undefined ? undefined : { animationDelay: `${delayMs}ms` }}
      onAnimationEnd={onAnimationEnd}
    />
  );
}

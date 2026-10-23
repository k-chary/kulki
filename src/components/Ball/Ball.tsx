import type { AnimationEvent } from 'react';
import type { Color } from '../../rules';
import styles from './Ball.module.css';

export type BallState = 'idle' | 'selected' | 'shake' | 'clearing' | 'spawning';

export interface BallProps {
  color: Color;
  state?: BallState;
  /** Spawn stagger, read from --dur-spawn-stagger by the caller. */
  delayMs?: number;
  /** Fires when a shake, clear or spawn ends (the hop loops and never ends). */
  onAnimationEnd?: () => void;
  className?: string;
}

/**
 * A ball, 80% of its container. A parent resizes it by overriding --ball-size
 * and scales it on hover through --ball-scale.
 */
export function Ball({ color, state = 'idle', delayMs, onAnimationEnd, className }: BallProps) {
  const handleAnimationEnd = onAnimationEnd
    ? (event: AnimationEvent<HTMLSpanElement>) => {
        if (event.target === event.currentTarget) onAnimationEnd();
      }
    : undefined;
  return (
    <span
      className={className ? `${styles.ball} ${className}` : styles.ball}
      data-color={color}
      data-state={state}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
      onAnimationEnd={handleAnimationEnd}
      aria-hidden="true"
    />
  );
}

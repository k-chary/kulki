import type { Color } from '../../rules/color';
import { Ball } from '../Ball/Ball';
import styles from './PreviewSlot.module.css';

export interface PreviewSlotProps {
  /** Empty only in Storybook; the game always shows three colors. */
  color?: Color;
  state?: 'idle' | 'spawning';
}

/** One 44 px slot of the „Następne” preview. */
export function PreviewSlot({ color, state = 'idle' }: PreviewSlotProps) {
  return <span className={styles.slot}>{color && <Ball color={color} state={state} />}</span>;
}

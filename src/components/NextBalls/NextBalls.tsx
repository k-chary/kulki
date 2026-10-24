import { COLOR_NAMES } from '../../format';
import type { Color } from '../../rules/color';
import { Panel } from '../Panel/Panel';
import { PreviewSlot } from '../PreviewSlot/PreviewSlot';
import styles from './NextBalls.module.css';

export interface NextBallsProps {
  colors: readonly Color[];
  /** Just redrawn: the balls pop in with the same stagger as on the board. */
  fresh?: boolean;
}

/** „Następne”: the colors of the next three balls and the rule for when they appear. */
export function NextBalls({ colors, fresh = false }: NextBallsProps) {
  return (
    <Panel label="Następne">
      <div
        className={styles.next}
        role="img"
        aria-label={colors.map((c) => COLOR_NAMES[c]).join(', ')}
      >
        {colors.map((color, i) => (
          <PreviewSlot key={i} color={color} state={fresh ? 'spawning' : 'idle'} />
        ))}
      </div>
      <p className={styles.sub}>pojawią się po ruchu bez zbicia</p>
    </Panel>
  );
}

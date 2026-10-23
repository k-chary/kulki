import { formatCleared, formatNumber } from '../../format';
import { Panel } from '../Panel/Panel';
import styles from './ScorePanel.module.css';

export interface ScorePanelProps {
  score: number;
  /** The number on screen; runs from the old score to `score` while a clear plays. */
  shownScore?: number;
  cleared: number;
  /** Points just won, shown as a „+50” chip that rises and fades. */
  delta?: number;
  /** Changes with every new delta, so the chip restarts its animation. */
  deltaId?: number;
}

/** „Wynik”: the current points and how many balls were cleared. */
export function ScorePanel({
  score,
  shownScore = score,
  cleared,
  delta,
  deltaId,
}: ScorePanelProps) {
  return (
    <Panel label="Wynik">
      <div className={styles.line}>
        <span className={styles.score}>{formatNumber(shownScore)}</span>
        {delta !== undefined && delta > 0 && (
          <span key={deltaId} className={styles.delta} aria-hidden="true">
            +{formatNumber(delta)}
          </span>
        )}
      </div>
      <p className={styles.sub}>{formatCleared(cleared)}</p>
    </Panel>
  );
}

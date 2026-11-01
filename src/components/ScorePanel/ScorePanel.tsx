import { chipStep, formatBonusDetail, formatCleared, formatNumber } from '../../format';
import { Panel } from '../Panel/Panel';
import styles from './ScorePanel.module.css';

export interface ScorePanelProps {
  score: number;
  /** The number on screen; runs from the old score to `score` while a clear plays. */
  shownScore?: number;
  cleared: number;
  /** Points just won, shown as a „+50” chip that stays until the next score or --dur-delta. */
  delta?: number;
  /** Changes with every new delta, so the chip restarts its animation. */
  deltaId?: number;
  /** The balls of the clear behind `delta`; with `bonus` it sets the chip's size and color. */
  deltaBalls?: number;
  /** The part of `delta` above 10 per ball; above 0 it adds „9 kulek · premia +100”. */
  deltaBonus?: number;
}

/** „Wynik”: the current points and how many balls were cleared. */
export function ScorePanel({
  score,
  shownScore = score,
  cleared,
  delta,
  deltaId,
  deltaBalls = 0,
  deltaBonus = 0,
}: ScorePanelProps) {
  const step = chipStep(deltaBalls, deltaBonus);
  return (
    <Panel label="Wynik">
      <div className={styles.body}>
        <span className={styles.score}>{formatNumber(shownScore)}</span>
        <p className={styles.sub}>{formatCleared(cleared)}</p>
        {delta !== undefined && delta > 0 && (
          <span key={deltaId} className={styles.gain} data-step={step} aria-hidden="true">
            <span className={styles.delta}>+{formatNumber(delta)}</span>
            {deltaBonus > 0 && (
              <span className={styles.detail}>{formatBonusDetail(deltaBalls, deltaBonus)}</span>
            )}
          </span>
        )}
      </div>
    </Panel>
  );
}

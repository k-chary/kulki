import {
  chipStep,
  formatBonusDetail,
  formatCleared,
  formatNumber,
  formatUndoCost,
} from '../../format';
import { Chip, type ChipSize, type ChipTone } from '../Chip/Chip';
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
  /** Points an undo just cost, shown as a soft „−20” chip like the „+50”; `penaltyId` restarts it. */
  penalty?: number;
  penaltyId?: number;
}

const STEPS: { tone: ChipTone; size: ChipSize }[] = [
  { tone: 'soft', size: 'sm' },
  { tone: 'accent', size: 'md' },
  { tone: 'warm', size: 'lg' },
  { tone: 'hot', size: 'xl' },
];

/** „Wynik”: the current points and how many balls were cleared. */
export function ScorePanel({
  score,
  shownScore = score,
  cleared,
  delta,
  deltaId,
  deltaBalls = 0,
  deltaBonus = 0,
  penalty,
  penaltyId,
}: ScorePanelProps) {
  const step = chipStep(deltaBalls, deltaBonus);
  return (
    <Panel label="Wynik">
      <div className={styles.body}>
        <span className={styles.score}>{formatNumber(shownScore)}</span>
        <p className={styles.sub}>{formatCleared(cleared)}</p>
        {delta !== undefined && delta > 0 && (
          <span key={deltaId} className={styles.gain} data-step={step} aria-hidden="true">
            <Chip {...STEPS[step]} pulse={step === 3}>
              +{formatNumber(delta)}
            </Chip>
            {deltaBonus > 0 && (
              <span className={styles.detail}>{formatBonusDetail(deltaBalls, deltaBonus)}</span>
            )}
          </span>
        )}
        {penalty !== undefined && penalty > 0 && (
          <span key={`penalty-${penaltyId}`} className={styles.gain} aria-hidden="true">
            <Chip tone="soft" size="sm">
              {formatUndoCost(penalty, true)}
            </Chip>
          </span>
        )}
      </div>
    </Panel>
  );
}

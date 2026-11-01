import { useState, type RefObject } from 'react';
import { formatNumber } from '../../format';
import { BonusPicker } from '../BonusPicker/BonusPicker';
import { Button } from '../Button/Button';
import { ColorCountPicker } from '../ColorCountPicker/ColorCountPicker';
import { Dialog } from '../Dialog/Dialog';
import styles from './NewGameDialog.module.css';

export interface NewGameDialogProps {
  /** The count chosen when the dialog opens: the current or last game's. */
  colorCount: number;
  /** The scoring chosen when the dialog opens: the next-game setting, also set in „Opcje”. */
  bonus?: boolean;
  /** The score of a game in progress that would be lost; null when nothing is lost. */
  score?: number | null;
  onCancel: () => void;
  onStart: (colorCount: number, bonus: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * „Nowa gra”: pick the color count and the scoring, then „Zacznij”. With a game in progress it warns
 * that the game is lost and „Anuluj” starts focused. Esc, a scrim click and
 * „Anuluj” close it with nothing changed.
 */
export function NewGameDialog({
  colorCount,
  bonus: initialBonus = false,
  score = null,
  onCancel,
  onStart,
  returnFocusRef,
}: NewGameDialogProps) {
  const [count, setCount] = useState(colorCount);
  const [bonus, setBonus] = useState(initialBonus);
  const losing = score !== null;
  return (
    <Dialog title="Nowa gra" onClose={onCancel} returnFocusRef={returnFocusRef}>
      <ColorCountPicker value={count} onChange={setCount} />
      <BonusPicker value={bonus} onChange={setBonus} />
      {losing && (
        <p className={styles.warning}>Obecna gra ({formatNumber(score)} pkt) zostanie utracona.</p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" autoFocus={losing} onClick={onCancel}>
          Anuluj
        </Button>
        <Button variant="primary" autoFocus={!losing} onClick={() => onStart(count, bonus)}>
          Zacznij
        </Button>
      </div>
    </Dialog>
  );
}

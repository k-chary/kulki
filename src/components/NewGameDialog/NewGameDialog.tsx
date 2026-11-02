import { useId, useState, type RefObject } from 'react';
import { formatBonus, formatNumber } from '../../format';
import { Button } from '../Button/Button';
import { ColorCountPicker } from '../ColorCountPicker/ColorCountPicker';
import { Dialog } from '../Dialog/Dialog';
import styles from './NewGameDialog.module.css';

export interface NewGameDialogProps {
  /** The count chosen when the dialog opens: the current or last game's. */
  colorCount: number;
  /** The scoring the game will start with; it is set in „Opcje”, here only summed up. */
  bonus?: boolean;
  /** The score of a game in progress that would be lost; null when nothing is lost. */
  score?: number | null;
  onCancel: () => void;
  onStart: (colorCount: number, bonus: boolean) => void;
  /**
   * „Zmień w Opcjach”: opens „Opcje” on its game tab. Gets the count picked so far,
   * so „Nowa gra” can come back with it. Without it the link is not shown.
   */
  onOpenOptions?: (colorCount: number) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * „Nowa gra”: pick the color count, check the other settings in a short summary
 * (changed in „Opcje”), then „Zacznij”. With a game in progress it warns that the
 * game is lost and „Anuluj” starts focused. Esc, a scrim click and „Anuluj” close
 * it with nothing changed.
 */
export function NewGameDialog({
  colorCount,
  bonus = false,
  score = null,
  onCancel,
  onStart,
  onOpenOptions,
  returnFocusRef,
}: NewGameDialogProps) {
  const labelId = useId();
  const [count, setCount] = useState(colorCount);
  const losing = score !== null;
  return (
    <Dialog title="Nowa gra" onClose={onCancel} returnFocusRef={returnFocusRef}>
      <ColorCountPicker value={count} onChange={setCount} />
      <section className={styles.summary} aria-labelledby={labelId}>
        <div className={styles.summaryHead}>
          <span className={styles.label} id={labelId}>
            Ustawienia gry
          </span>
          {onOpenOptions && (
            <button type="button" className={styles.link} onClick={() => onOpenOptions(count)}>
              Zmień w Opcjach
            </button>
          )}
        </div>
        <dl className={styles.list}>
          <div className={styles.item}>
            <dt>Punktacja</dt>
            <dd>{capitalize(formatBonus(bonus))}</dd>
          </div>
        </dl>
      </section>
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

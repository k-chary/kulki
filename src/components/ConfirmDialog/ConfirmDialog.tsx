import type { RefObject } from 'react';
import { formatNumber } from '../../format';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** The score of the game that would be lost. */
  score: number;
  /** Set when the player picked another color count: the new game uses it. */
  colorCount?: number;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * „Zacząć nową grę?”, or „Zacząć nową grę z 8 kolorami?” after picking a color count.
 * Esc, a scrim click and „Anuluj” cancel; „Anuluj” starts focused.
 */
export function ConfirmDialog({
  score,
  colorCount,
  onCancel,
  onConfirm,
  returnFocusRef,
}: ConfirmDialogProps) {
  const title =
    colorCount === undefined ? 'Zacząć nową grę?' : `Zacząć nową grę z ${colorCount} kolorami?`;
  return (
    <Dialog title={title} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <p className={styles.body}>Obecna gra ({formatNumber(score)} pkt) zostanie utracona.</p>
      <div className={styles.actions}>
        <Button variant="secondary" autoFocus onClick={onCancel}>
          Anuluj
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Nowa gra
        </Button>
      </div>
    </Dialog>
  );
}

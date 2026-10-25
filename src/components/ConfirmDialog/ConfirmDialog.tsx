import type { RefObject } from 'react';
import { formatNumber } from '../../format';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** The score of the game that would be lost. */
  score: number;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/** „Zacząć nową grę?” Esc, a scrim click and „Anuluj” cancel; „Anuluj” starts focused. */
export function ConfirmDialog({ score, onCancel, onConfirm, returnFocusRef }: ConfirmDialogProps) {
  return (
    <Dialog title="Zacząć nową grę?" onClose={onCancel} returnFocusRef={returnFocusRef}>
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

import type { RefObject } from 'react';
import type { BallTheme } from '../../format';
import { BallThemePicker } from '../BallThemePicker/BallThemePicker';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './OptionsDialog.module.css';

export interface OptionsDialogProps {
  ballTheme: BallTheme;
  /** A theme applies at once, so the board behind the dialog shows it. */
  onBallThemeChange: (theme: BallTheme) => void;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * „Opcje”: settings that change only the look, so they can change mid-game. Each
 * choice applies and is remembered at once; „Gotowe”, Esc and a scrim click close it.
 */
export function OptionsDialog({
  ballTheme,
  onBallThemeChange,
  onClose,
  returnFocusRef,
}: OptionsDialogProps) {
  return (
    <Dialog title="Opcje" onClose={onClose} returnFocusRef={returnFocusRef}>
      <BallThemePicker value={ballTheme} onChange={onBallThemeChange} />
      <div className={styles.actions}>
        <Button variant="primary" autoFocus onClick={onClose}>
          Gotowe
        </Button>
      </div>
    </Dialog>
  );
}

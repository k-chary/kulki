import { useId, useState, type RefObject } from 'react';
import type { BallTheme } from '../../format';
import { BallThemePicker } from '../BallThemePicker/BallThemePicker';
import { BonusPicker } from '../BonusPicker/BonusPicker';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './OptionsDialog.module.css';

export type OptionsTab = 'game' | 'look';

const TABS: readonly { id: OptionsTab; label: string }[] = [
  { id: 'game', label: 'Gra' },
  { id: 'look', label: 'Wygląd' },
];

export interface OptionsDialogProps {
  ballTheme: BallTheme;
  /** A theme applies at once, so the board behind the dialog shows it. */
  onBallThemeChange: (theme: BallTheme) => void;
  /**
   * The scoring the next game starts with, summed up in „Nowa gra”. It never
   * touches the game in progress. Without it only „Wygląd” shows, with no tabs.
   */
  bonus?: boolean;
  /** Each change is remembered at once and shows in „Nowa gra”. */
  onBonusChange?: (bonus: boolean) => void;
  /** The tab shown first; „Gra” unless a story asks otherwise. */
  initialTab?: OptionsTab;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * „Opcje”: on the first tab („Gra”) the game settings, which wait for the next
 * game, and on the second („Wygląd”) the look, which applies at once. Two tabs
 * keep the card short enough for the board. Each choice is remembered at once;
 * „Gotowe”, Esc and a scrim click close it.
 */
export function OptionsDialog({
  ballTheme,
  onBallThemeChange,
  bonus,
  onBonusChange,
  initialTab = 'game',
  onClose,
  returnFocusRef,
}: OptionsDialogProps) {
  const baseId = useId();
  const [tab, setTab] = useState<OptionsTab>(initialTab);
  const tabbed = bonus !== undefined;
  const shown = tabbed ? tab : 'look';
  return (
    <Dialog title="Opcje" onClose={onClose} returnFocusRef={returnFocusRef}>
      {tabbed && (
        <div className={styles.tabs} role="tablist" aria-label="Opcje">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-controls={`${baseId}-panel-${id}`}
              aria-selected={shown === id}
              tabIndex={shown === id ? 0 : -1}
              className={styles.tab}
              onClick={() => setTab(id)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                const other = id === 'look' ? 'game' : 'look';
                setTab(other);
                document.getElementById(`${baseId}-tab-${other}`)?.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {tabbed && shown === 'game' && (
        <div
          className={styles.panel}
          role="tabpanel"
          id={`${baseId}-panel-game`}
          aria-labelledby={`${baseId}-tab-game`}
        >
          <p className={styles.note}>Obowiązuje od następnej gry. Obecna gra się nie zmieni.</p>
          <BonusPicker value={bonus} onChange={onBonusChange} />
        </div>
      )}
      {shown === 'look' && (
        <div
          className={styles.panel}
          role={tabbed ? 'tabpanel' : undefined}
          id={`${baseId}-panel-look`}
          aria-labelledby={tabbed ? `${baseId}-tab-look` : undefined}
        >
          <BallThemePicker value={ballTheme} onChange={onBallThemeChange} />
        </div>
      )}
      <div className={styles.actions}>
        <Button variant="primary" autoFocus onClick={onClose}>
          Gotowe
        </Button>
      </div>
    </Dialog>
  );
}

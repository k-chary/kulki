import { useId, useState, type RefObject } from 'react';
import type { BallTheme } from '../../format';
import { BallThemePicker } from '../BallThemePicker/BallThemePicker';
import { BonusPicker } from '../BonusPicker/BonusPicker';
import { Button } from '../Button/Button';
import { ColorCountPicker } from '../ColorCountPicker/ColorCountPicker';
import { Dialog } from '../Dialog/Dialog';
import styles from './OptionsDialog.module.css';

export interface NextGameSettings {
  colorCount: number;
  bonus: boolean;
}

export type OptionsTab = 'look' | 'next';

const TABS: readonly { id: OptionsTab; label: string }[] = [
  { id: 'look', label: 'Wygląd' },
  { id: 'next', label: 'Następna gra' },
];

export interface OptionsDialogProps {
  ballTheme: BallTheme;
  /** A theme applies at once, so the board behind the dialog shows it. */
  onBallThemeChange: (theme: BallTheme) => void;
  /**
   * The settings the next game starts with, the same ones „Nowa gra” opens on.
   * They never touch the game in progress.
   */
  nextGame?: NextGameSettings;
  /** Each change is remembered at once and shows in „Nowa gra”. */
  onNextGameChange?: (next: NextGameSettings) => void;
  /** The tab shown first; „Wygląd” unless a story asks otherwise. */
  initialTab?: OptionsTab;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * „Opcje”: the look, which applies at once, and, on a second tab, the next
 * game's settings, which wait for the next game. Two tabs keep the card short
 * enough for the board. Each choice is remembered at once; „Gotowe”, Esc and a
 * scrim click close it.
 */
export function OptionsDialog({
  ballTheme,
  onBallThemeChange,
  nextGame,
  onNextGameChange,
  initialTab = 'look',
  onClose,
  returnFocusRef,
}: OptionsDialogProps) {
  const baseId = useId();
  const [tab, setTab] = useState<OptionsTab>(initialTab);
  const shown = nextGame ? tab : 'look';
  return (
    <Dialog title="Opcje" onClose={onClose} returnFocusRef={returnFocusRef}>
      {nextGame && (
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
                const other = id === 'look' ? 'next' : 'look';
                setTab(other);
                document.getElementById(`${baseId}-tab-${other}`)?.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {shown === 'look' && (
        <div
          className={styles.panel}
          role={nextGame ? 'tabpanel' : undefined}
          id={`${baseId}-panel-look`}
          aria-labelledby={nextGame ? `${baseId}-tab-look` : undefined}
        >
          <BallThemePicker value={ballTheme} onChange={onBallThemeChange} />
        </div>
      )}
      {nextGame && shown === 'next' && (
        <div
          className={styles.panel}
          role="tabpanel"
          id={`${baseId}-panel-next`}
          aria-labelledby={`${baseId}-tab-next`}
        >
          <p className={styles.note}>Obowiązuje od następnej gry. Obecna gra się nie zmieni.</p>
          <ColorCountPicker
            value={nextGame.colorCount}
            onChange={(colorCount) => onNextGameChange?.({ ...nextGame, colorCount })}
          />
          <BonusPicker
            value={nextGame.bonus}
            onChange={(bonus) => onNextGameChange?.({ ...nextGame, bonus })}
          />
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

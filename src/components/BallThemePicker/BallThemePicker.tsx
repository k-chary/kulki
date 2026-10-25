import { useId } from 'react';
import {
  BALL_THEME_HINTS,
  BALL_THEME_NAMES,
  BALL_THEMES,
  colorNames,
  type BallTheme,
} from '../../format';
import { COLORS } from '../../rules/color';
import { Ball } from '../Ball/Ball';
import styles from './BallThemePicker.module.css';

export interface BallThemePickerProps {
  /** The chosen theme. */
  value: BallTheme;
  onChange?: (theme: BallTheme) => void;
  /** Storybook only: shows hover or focus on this theme. */
  force?: { theme: BallTheme; state: 'hover' | 'focus' };
}

/**
 * „Kolory kulek” in „Opcje”: one card per theme, each showing all nine balls in that
 * theme whatever the app's theme is, so the two can be compared.
 */
export function BallThemePicker({ value, onChange, force }: BallThemePickerProps) {
  const labelId = useId();
  return (
    <div className={styles.picker}>
      <span className={styles.label} id={labelId}>
        Kolory kulek
      </span>
      <div className={styles.cards} role="radiogroup" aria-labelledby={labelId}>
        {BALL_THEMES.map((theme) => (
          <button
            key={theme}
            type="button"
            role="radio"
            className={styles.card}
            aria-checked={theme === value}
            data-ball-theme={theme}
            data-force={force?.theme === theme ? force.state : undefined}
            onClick={() => onChange?.(theme)}
          >
            <span className={styles.name}>{BALL_THEME_NAMES[theme]}</span>
            <span className={styles.hint}>{BALL_THEME_HINTS[theme]}</span>
            <span
              className={styles.strip}
              role="img"
              aria-label={COLORS.map((color) => colorNames(theme)[color]).join(', ')}
            >
              {COLORS.map((color) => (
                <span key={color} className={styles.dot}>
                  <Ball color={color} />
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

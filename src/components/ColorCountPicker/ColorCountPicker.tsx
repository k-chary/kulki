import { useId } from 'react';
import { COLOR_COUNT_LEVELS, COLOR_NAMES, formatColorCount } from '../../format';
import { COLOR_COUNTS, COLORS, colorsFor } from '../../rules/color';
import { Ball } from '../Ball/Ball';
import styles from './ColorCountPicker.module.css';

export interface ColorCountPickerProps {
  /** The chosen color count. */
  value: number;
  onChange?: (count: number) => void;
  /** Storybook only: shows hover or focus on this count. */
  force?: { count: number; state: 'hover' | 'focus' };
}

/**
 * „Liczba kolorów” in the „Nowa gra” dialog: 5 to 9 as a segmented control, then
 * the colors in play and the difficulty's name.
 */
export function ColorCountPicker({ value, onChange, force }: ColorCountPickerProps) {
  const labelId = useId();
  const inPlay = colorsFor(value);
  return (
    <div className={styles.picker}>
      <span className={styles.label} id={labelId}>
        Liczba kolorów
      </span>
      <div className={styles.segments} role="radiogroup" aria-labelledby={labelId}>
        {COLOR_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            role="radio"
            className={styles.segment}
            aria-checked={count === value}
            aria-label={formatColorCount(count)}
            data-force={force?.count === count ? force.state : undefined}
            onClick={() => onChange?.(count)}
          >
            {count}
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <span
          className={styles.strip}
          role="img"
          aria-label={inPlay.map((color) => COLOR_NAMES[color]).join(', ')}
        >
          {COLORS.map((color) =>
            inPlay.includes(color) ? (
              <span key={color} className={styles.dot}>
                <Ball color={color} />
              </span>
            ) : (
              <span key={color} className={styles.dot} data-off="true" />
            ),
          )}
        </span>
        <span className={styles.level}>{COLOR_COUNT_LEVELS[value]}</span>
      </div>
    </div>
  );
}

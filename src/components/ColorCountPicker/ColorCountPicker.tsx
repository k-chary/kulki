import { useId } from 'react';
import { COLOR_COUNT_LEVELS, formatColorCount } from '../../format';
import { COLOR_COUNTS } from '../../rules/color';
import styles from './ColorCountPicker.module.css';

export interface ColorCountPickerProps {
  /** The color count of the game on the board. */
  value: number;
  /** Reports a different count; the screen starts a new game with it (or asks first). */
  onChange?: (count: number) => void;
  /** During an animation or a dialog, like „Nowa gra”. */
  disabled?: boolean;
  /** Storybook only: shows hover or focus on this count. */
  force?: { count: number; state: 'hover' | 'focus' };
}

/**
 * „Kolory”: how many colors the game uses, 4 to 9, as one control-height row in
 * the rail. Each count's tooltip names its difficulty.
 */
export function ColorCountPicker({
  value,
  onChange,
  disabled = false,
  force,
}: ColorCountPickerProps) {
  const labelId = useId();
  return (
    <div className={styles.picker} data-disabled={disabled}>
      <span className={styles.label} id={labelId}>
        Kolory
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
            title={`${formatColorCount(count)} · ${COLOR_COUNT_LEVELS[count] ?? ''}`}
            disabled={disabled}
            data-force={force?.count === count ? force.state : undefined}
            onClick={() => {
              if (count !== value) onChange?.(count);
            }}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}

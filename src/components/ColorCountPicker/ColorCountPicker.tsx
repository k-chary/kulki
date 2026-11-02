import { useId } from 'react';
import { COLOR_COUNT_LEVELS, COLOR_NAMES, formatColorCount } from '../../format';
import { COLOR_COUNTS, COLORS, colorsFor } from '../../rules/color';
import { Ball } from '../Ball/Ball';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import styles from './ColorCountPicker.module.css';

const COUNT_OPTIONS = COLOR_COUNTS.map((count) => ({
  value: count,
  label: String(count),
  ariaLabel: formatColorCount(count),
}));

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
      <SegmentedControl
        options={COUNT_OPTIONS}
        value={value}
        onChange={onChange}
        ariaLabelledBy={labelId}
        force={force && { value: force.count, state: force.state }}
      />
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

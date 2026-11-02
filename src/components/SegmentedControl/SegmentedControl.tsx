import type { ReactNode } from 'react';

import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T> {
  value: T;
  /** What the segment shows. */
  label: ReactNode;
  /** Spoken name when the visible label is not enough. */
  ariaLabel?: string;
  /** Draws a small dot under the label, e.g. for the current game's setting. */
  marked?: boolean;
}

export interface SegmentedControlProps<T> {
  options: readonly SegmentedOption<T>[];
  /** The chosen option's value. */
  value: T;
  onChange?: (value: T) => void;
  /** `regular` fills dialogs; `compact` fits the rail. */
  size?: 'regular' | 'compact';
  /** `numeric` is monospaced for counts; `text` uses the body font for words. */
  text?: 'numeric' | 'text';
  /** Name of the group: give exactly one of `ariaLabel` or `ariaLabelledBy`. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Storybook only: shows hover or focus on this option. */
  force?: { value: T; state: 'hover' | 'focus' };
}

/**
 * A row of mutually exclusive options on one sunken track, the chosen one raised
 * in the accent. The shared base of the color count, scoring and highscore pickers.
 */
export function SegmentedControl<T extends string | number | boolean>({
  options,
  value,
  onChange,
  size = 'regular',
  text = 'numeric',
  ariaLabel,
  ariaLabelledBy,
  force,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={styles.segments}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-size={size}
      data-text={text}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          className={styles.segment}
          aria-checked={option.value === value}
          aria-label={option.ariaLabel}
          data-marked={option.marked ?? false}
          data-force={force?.value === option.value ? force.state : undefined}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

import { useId } from 'react';
import { formatBonus } from '../../format';
import picker from '../ColorCountPicker/ColorCountPicker.module.css';
import styles from './BonusPicker.module.css';

export interface BonusPickerProps {
  /** Whether the bonus for long clears is on. */
  value: boolean;
  onChange?: (bonus: boolean) => void;
  /** Storybook only: shows hover or focus on this option. */
  force?: { bonus: boolean; state: 'hover' | 'focus' };
}

const OPTIONS = [false, true] as const;

/**
 * „Punktacja” in „Nowa gra” and „Opcje”: „Bez premii” or „Z premią”, drawn like
 * the color count's segmented control, with a line on what the choice means.
 */
export function BonusPicker({ value, onChange, force }: BonusPickerProps) {
  const labelId = useId();
  return (
    <div className={picker.picker}>
      <span className={picker.label} id={labelId}>
        Punktacja
      </span>
      <div className={picker.segments} role="radiogroup" aria-labelledby={labelId}>
        {OPTIONS.map((bonus) => {
          const name = formatBonus(bonus);
          return (
            <button
              key={name}
              type="button"
              role="radio"
              className={`${picker.segment} ${styles.segment}`}
              aria-checked={bonus === value}
              data-force={force?.bonus === bonus ? force.state : undefined}
              onClick={() => onChange?.(bonus)}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          );
        })}
      </div>
      <p className={styles.hint}>
        {value
          ? 'Od 6. kulki w jednym zbiciu każda warta o 10 pkt więcej'
          : '10 pkt za każdą kulkę'}
      </p>
    </div>
  );
}

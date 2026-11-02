import { useId } from 'react';
import { formatBonus } from '../../format';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import styles from './BonusPicker.module.css';

export interface BonusPickerProps {
  /** Whether the bonus for long clears is on. */
  value: boolean;
  onChange?: (bonus: boolean) => void;
  /** Storybook only: shows hover or focus on this option. */
  force?: { bonus: boolean; state: 'hover' | 'focus' };
}

const OPTIONS = [false, true].map((bonus) => {
  const name = formatBonus(bonus);
  return { value: bonus, label: name.charAt(0).toUpperCase() + name.slice(1) };
});

/**
 * „Punktacja” in the „Gra” tab of „Opcje”: „Bez premii” or „Z premią”, drawn like
 * the color count's segmented control, with a line on what the choice means.
 */
export function BonusPicker({ value, onChange, force }: BonusPickerProps) {
  const labelId = useId();
  return (
    <div className={styles.picker}>
      <span className={styles.label} id={labelId}>
        Punktacja
      </span>
      <SegmentedControl
        options={OPTIONS}
        value={value}
        onChange={onChange}
        text="text"
        ariaLabelledBy={labelId}
        force={force && { value: force.bonus, state: force.state }}
      />
      <p className={styles.hint}>
        {value
          ? 'Od 6. kulki w jednym zbiciu każda warta o 10 pkt więcej'
          : '10 pkt za każdą kulkę'}
      </p>
    </div>
  );
}

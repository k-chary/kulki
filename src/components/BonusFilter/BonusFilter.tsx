import { formatBonus } from '../../format';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

export interface BonusFilterProps {
  /** Whether the bonus lists are shown. */
  value: boolean;
  /** The current game's scoring, marked with a dot. */
  gameBonus?: boolean;
  onChange?: (bonus: boolean) => void;
  /** Storybook only: shows hover or focus on this option. */
  force?: { bonus: boolean; state: 'hover' | 'focus' };
}

/**
 * „Bez premii | Z premią” under the 5–9 filter: picks whether the panel shows
 * the lists with or without the bonus, without touching the game in progress.
 */
export function BonusFilter({ value, gameBonus, onChange, force }: BonusFilterProps) {
  const options = [false, true].map((bonus) => {
    const name = formatBonus(bonus);
    const game = bonus === gameBonus;
    return {
      value: bonus,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      ariaLabel: `${name}${game ? ', ta gra' : ''}`,
      marked: game,
    };
  });
  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      size="compact"
      text="text"
      ariaLabel="Pokaż wyniki"
      force={force && { value: force.bonus, state: force.state }}
    />
  );
}

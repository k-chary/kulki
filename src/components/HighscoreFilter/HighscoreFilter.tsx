import { formatColorCount } from '../../format';
import { COLOR_COUNTS } from '../../rules/color';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

export interface HighscoreFilterProps {
  /** The color count whose top 30 is shown. */
  value: number;
  /** The current game's color count, marked with a dot under its number. */
  gameColorCount?: number;
  onChange?: (count: number) => void;
  /** Storybook only: shows hover or focus on this count. */
  force?: { count: number; state: 'hover' | 'focus' };
}

/**
 * The 5–9 row under „Najlepsze wyniki”: picks which count's top 30 the panel
 * shows, without touching the game in progress.
 */
export function HighscoreFilter({ value, gameColorCount, onChange, force }: HighscoreFilterProps) {
  const options = COLOR_COUNTS.map((count) => {
    const game = count === gameColorCount;
    return {
      value: count,
      label: String(count),
      ariaLabel: `${formatColorCount(count)}${game ? ', ta gra' : ''}`,
      marked: game,
    };
  });
  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      size="compact"
      ariaLabel="Pokaż wyniki dla"
      force={force && { value: force.count, state: force.state }}
    />
  );
}

import { formatColorCount } from '../../format';
import { COLOR_COUNTS } from '../../rules/color';
import styles from './HighscoreFilter.module.css';

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
  return (
    <div className={styles.segments} role="radiogroup" aria-label="Pokaż wyniki dla">
      {COLOR_COUNTS.map((count) => {
        const game = count === gameColorCount;
        return (
          <button
            key={count}
            type="button"
            role="radio"
            className={styles.segment}
            aria-checked={count === value}
            aria-label={`${formatColorCount(count)}${game ? ', ta gra' : ''}`}
            data-game={game}
            data-force={force?.count === count ? force.state : undefined}
            onClick={() => onChange?.(count)}
          >
            {count}
          </button>
        );
      })}
    </div>
  );
}

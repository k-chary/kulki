import { formatBonus } from '../../format';
import filter from '../HighscoreFilter/HighscoreFilter.module.css';
import styles from './BonusFilter.module.css';

export interface BonusFilterProps {
  /** Whether the bonus lists are shown. */
  value: boolean;
  /** The current game's scoring, marked with a dot. */
  gameBonus?: boolean;
  onChange?: (bonus: boolean) => void;
  /** Storybook only: shows hover or focus on this option. */
  force?: { bonus: boolean; state: 'hover' | 'focus' };
}

const OPTIONS = [false, true] as const;

/**
 * „Bez premii | Z premią” under the 5–9 filter: picks whether the panel shows
 * the lists with or without the bonus, without touching the game in progress.
 */
export function BonusFilter({ value, gameBonus, onChange, force }: BonusFilterProps) {
  return (
    <div className={filter.segments} role="radiogroup" aria-label="Pokaż wyniki">
      {OPTIONS.map((bonus) => {
        const name = formatBonus(bonus);
        const game = bonus === gameBonus;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            className={`${filter.segment} ${styles.segment}`}
            aria-checked={bonus === value}
            aria-label={`${name}${game ? ', ta gra' : ''}`}
            data-game={game}
            data-force={force?.bonus === bonus ? force.state : undefined}
            onClick={() => onChange?.(bonus)}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

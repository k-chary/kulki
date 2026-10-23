import type { Ref } from 'react';
import { formatDate, formatNumber } from '../../format';
import styles from './ScoreRow.module.css';

export interface ScoreRowProps {
  /**
   * stored: a past game. saved: the entry just saved, ringed until the next
   * game. current: the game in progress, „Ta gra · teraz”, at the place it would take.
   */
  kind: 'stored' | 'saved' | 'current';
  place: number;
  score: number;
  /** The player's name; not used for the current game. */
  name?: string;
  /** When the game ended, as an ISO 8601 string; not used for the current game. */
  date?: string;
  /** Odd rows (1st, 3rd, …) are striped. */
  striped: boolean;
  ref?: Ref<HTMLLIElement>;
}

/** One row of „Najlepsze wyniki”: place, name, date (dd.mm.rrrr) and points. */
export function ScoreRow({ kind, place, score, name = '', date, striped, ref }: ScoreRowProps) {
  const current = kind === 'current';
  const shownName = current ? 'Ta gra' : name;
  const shownDate = current ? 'teraz' : date && formatDate(date);
  return (
    <li
      ref={ref}
      className={styles.row}
      data-kind={kind}
      data-stripe={striped ? 'odd' : 'even'}
      aria-current={current ? 'true' : undefined}
    >
      <span className={styles.rank}>{place}.</span>
      <span className={styles.who}>
        <span className={styles.name} title={shownName}>
          {shownName}
        </span>
        <span className={styles.date}>{shownDate}</span>
      </span>
      <span className={styles.points}>{formatNumber(score)}</span>
    </li>
  );
}

import { formatColorCount, formatNumber } from '../../format';
import styles from './CurrentGameNote.module.css';

export interface CurrentGameNoteProps {
  /** The current game's color count. */
  colorCount: number;
  /** The place the game would take in its own top 30; null when it would not make it. */
  place: number | null;
  score: number;
  /** Shows the current game's list again. */
  onShow?: () => void;
  /** Storybook only: shows hover or focus. */
  force?: 'hover' | 'focus';
}

/**
 * Pinned under the highscore list while it shows another color count, so the
 * game in progress keeps its place in view. A click switches back to its list.
 */
export function CurrentGameNote({ colorCount, place, score, onShow, force }: CurrentGameNoteProps) {
  const counted = formatColorCount(colorCount);
  return (
    <button
      type="button"
      className={styles.note}
      aria-label={`Ta gra: ${place === null ? 'poza top 30' : `${place}. miejsce`}, ${formatNumber(score)} pkt. Pokaż wyniki dla ${counted}`}
      data-force={force}
      onClick={onShow}
    >
      <span className={styles.rank}>{place === null ? '–' : `${place}.`}</span>
      <span className={styles.who}>
        <span className={styles.name}>Ta gra · {counted}</span>
        <span className={styles.hint}>{place === null ? 'poza top 30' : 'teraz'}</span>
      </span>
      <span className={styles.points}>{formatNumber(score)}</span>
    </button>
  );
}

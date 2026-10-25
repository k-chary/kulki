import { useEffect, useRef } from 'react';
import type { HighscoreRow } from '../../highscores/ranking';
import { formatColorCount } from '../../format';
import { prefersReducedMotion } from '../../styles/motion';
import { CurrentGameNote } from '../CurrentGameNote/CurrentGameNote';
import { HighscoreFilter } from '../HighscoreFilter/HighscoreFilter';
import { Panel } from '../Panel/Panel';
import { ScoreRow } from '../ScoreRow/ScoreRow';
import styles from './HighscoreList.module.css';

export interface HighscoreListProps {
  /** At most 30 rows, best first, already merged with the game in progress (rowsWithLive). */
  rows: readonly HighscoreRow[];
  /** The place of the entry just saved, ringed until the next game starts. */
  savedPlace?: number | null;
  /** Each color count keeps its own top 30; the label names the one shown. */
  colorCount?: number;
  /** The current game's color count; while it differs from colorCount, rows hold no „Ta gra”. */
  gameColorCount?: number;
  /** Shows the 5–9 filter; called with the count whose list to show. */
  onColorCountChange?: (count: number) => void;
  /**
   * The current game in its own list (place null when outside the top 30),
   * pinned under the rows while another count's list is shown.
   */
  current?: { place: number | null; score: number };
}

/**
 * „Najlepsze wyniki”: fills the rest of the rail and scrolls. The current or
 * just-saved row is scrolled into view whenever it changes.
 */
export function HighscoreList({
  rows,
  savedPlace = null,
  colorCount,
  gameColorCount,
  onColorCountChange,
  current,
}: HighscoreListProps) {
  const markedRef = useRef<HTMLLIElement>(null);
  const live = rows.find((row) => row.kind === 'live');
  const markedKey = live
    ? `live:${live.place}`
    : savedPlace !== null
      ? `saved:${savedPlace}`
      : null;

  useEffect(() => {
    const row = markedRef.current;
    if (markedKey === null || !row) return;
    row.scrollIntoView({
      block: 'nearest',
      behavior: prefersReducedMotion(row) ? 'auto' : 'smooth',
    });
  }, [markedKey]);

  const empty = !rows.some((row) => row.kind === 'stored');
  const other =
    colorCount !== undefined && gameColorCount !== undefined && colorCount !== gameColorCount;
  return (
    <Panel
      label={
        colorCount === undefined
          ? 'Najlepsze wyniki'
          : `Najlepsze wyniki · ${formatColorCount(colorCount)}`
      }
      grow
    >
      {onColorCountChange && colorCount !== undefined && (
        <HighscoreFilter
          value={colorCount}
          gameColorCount={gameColorCount}
          onChange={onColorCountChange}
        />
      )}
      {empty && (
        <p className={styles.empty}>
          {other
            ? `Brak wyników dla ${formatColorCount(colorCount)}.`
            : 'Jeszcze nie ma wyników. Twoja pierwsza gra trafi tutaj.'}
        </p>
      )}
      <ol className={styles.list}>
        {rows.map((row, i) => {
          const striped = i % 2 === 0;
          if (row.kind === 'live') {
            return (
              <ScoreRow
                key="live"
                ref={markedRef}
                kind="current"
                place={row.place}
                score={row.score}
                striped={striped}
              />
            );
          }
          const saved = row.place === savedPlace;
          return (
            <ScoreRow
              key={`${row.place}:${row.entry.date}`}
              ref={saved ? markedRef : undefined}
              kind={saved ? 'saved' : 'stored'}
              place={row.place}
              score={row.entry.score}
              name={row.entry.name}
              date={row.entry.date}
              striped={striped}
            />
          );
        })}
      </ol>
      {other && current && (
        <CurrentGameNote
          colorCount={gameColorCount}
          place={current.place}
          score={current.score}
          onShow={() => onColorCountChange?.(gameColorCount)}
        />
      )}
    </Panel>
  );
}

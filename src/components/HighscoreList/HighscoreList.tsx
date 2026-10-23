import { useEffect, useRef } from 'react';
import type { HighscoreRow } from '../../highscores/ranking';
import { prefersReducedMotion } from '../../styles/motion';
import { Panel } from '../Panel/Panel';
import { ScoreRow } from '../ScoreRow/ScoreRow';
import styles from './HighscoreList.module.css';

export interface HighscoreListProps {
  /** At most 30 rows, best first, already merged with the game in progress (rowsWithLive). */
  rows: readonly HighscoreRow[];
  /** The place of the entry just saved, ringed until the next game starts. */
  savedPlace?: number | null;
}

/**
 * „Najlepsze wyniki”: fills the rest of the rail and scrolls. The current or
 * just-saved row is scrolled into view whenever it changes.
 */
export function HighscoreList({ rows, savedPlace = null }: HighscoreListProps) {
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
  return (
    <Panel label="Najlepsze wyniki" grow>
      {empty && (
        <p className={styles.empty}>Jeszcze nie ma wyników. Twoja pierwsza gra trafi tutaj.</p>
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
    </Panel>
  );
}

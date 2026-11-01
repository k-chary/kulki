import { useEffect, useRef } from 'react';
import type { HighscoreRow } from '../../highscores/ranking';
import { formatBonus, formatColorCount } from '../../format';
import { prefersReducedMotion } from '../../styles/motion';
import { BonusFilter } from '../BonusFilter/BonusFilter';
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
  /** Whether the lists with the bonus for long clears are shown; each has its own top 30 per count. */
  bonus?: boolean;
  /** The current game's scoring; while it differs from bonus, rows hold no „Ta gra”. */
  gameBonus?: boolean;
  /** Shows the „Bez premii | Z premią” filter; called with the scoring whose lists to show. */
  onBonusChange?: (bonus: boolean) => void;
  /**
   * The current game in its own list (place null when outside the top 30),
   * pinned under the rows while another count's or scoring's list is shown.
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
  bonus,
  gameBonus,
  onBonusChange,
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
  const otherCount =
    colorCount !== undefined && gameColorCount !== undefined && colorCount !== gameColorCount;
  const otherBonus = bonus !== undefined && gameBonus !== undefined && bonus !== gameBonus;
  const other = otherCount || otherBonus;
  // The plain lists need no mention of their scoring; the bonus ones always say so.
  const scoring = bonus ? ` ${formatBonus(true)}` : '';
  return (
    <Panel
      label={
        colorCount === undefined
          ? 'Najlepsze wyniki'
          : bonus
            ? `Wyniki ${formatBonus(true)} · ${formatColorCount(colorCount)}`
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
      {onBonusChange && bonus !== undefined && (
        <BonusFilter value={bonus} gameBonus={gameBonus} onChange={onBonusChange} />
      )}
      {empty && (
        <p className={styles.empty}>
          {other && colorCount !== undefined
            ? `Brak wyników${scoring} dla ${formatColorCount(colorCount)}.`
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
      {other && current && gameColorCount !== undefined && (
        <CurrentGameNote
          colorCount={gameColorCount}
          bonus={gameBonus}
          place={current.place}
          score={current.score}
          onShow={() => {
            onColorCountChange?.(gameColorCount);
            if (gameBonus !== undefined) onBonusChange?.(gameBonus);
          }}
        />
      )}
    </Panel>
  );
}

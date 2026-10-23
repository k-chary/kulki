import type { ReactNode } from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  label: string;
  /** Takes the remaining rail height, as the highscore panel does. */
  grow?: boolean;
  children: ReactNode;
}

/** A surface card in the side rail with a small uppercase heading. */
export function Panel({ label, grow = false, children }: PanelProps) {
  return (
    <section className={styles.panel} data-grow={grow}>
      <h2 className={styles.label}>{label}</h2>
      {children}
    </section>
  );
}

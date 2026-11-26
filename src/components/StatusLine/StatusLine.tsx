import styles from './StatusLine.module.css';

export interface StatusLineProps {
  lead: string;
}

/** One line of feedback on the right of the header (empty most of the time), announced to screen readers. */
export function StatusLine({ lead }: StatusLineProps) {
  return (
    <p className={styles.status} role="status">
      {lead}
    </p>
  );
}

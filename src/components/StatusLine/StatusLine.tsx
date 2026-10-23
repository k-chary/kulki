import styles from './StatusLine.module.css';

export interface StatusLineProps {
  lead: string;
  /** Shown in bold after `lead`, e.g. the selected ball's color. */
  strong?: string;
  tail?: string;
}

/** One line of guidance on the right of the header, announced to screen readers. */
export function StatusLine({ lead, strong, tail }: StatusLineProps) {
  return (
    <p className={styles.status} role="status">
      {lead}
      {strong && <b>{strong}</b>}
      {tail}
    </p>
  );
}
